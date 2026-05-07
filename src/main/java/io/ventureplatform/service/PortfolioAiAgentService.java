package io.ventureplatform.service;

import io.ventureplatform.dto.PortfolioAgentRequest.ChatMessage;
import io.ventureplatform.dto.PortfolioAgentResponse;
import io.ventureplatform.projection.CompanyExtractionDataLiteProjection;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.service.external.OpenAiClient;
import io.ventureplatform.service.extraction.prompt.PromptLoader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import javax.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * AI agent service for portfolio company analysis.
 * Supports sync and streaming modes, caches uploaded
 * files and precomputed summaries, and enforces
 * per-user concurrency limits.
 */
@Service
@Slf4j
public class PortfolioAiAgentService {

  /** Default model for analysis. */
  static final String DEFAULT_MODEL = "o4-mini";

  /** Allowed model identifiers. */
  static final Set<String> ALLOWED_MODELS = Set.of(
      "gpt-5.2", "gpt-4.1", "gpt-4.1-mini",
      "o4-mini");

  /** Default reasoning effort level. */
  static final String DEFAULT_REASONING = "low";

  /** Max companies per query. */
  static final int MAX_COMPANIES = 1000;

  /** Uploaded CSV filename. */
  static final String DATA_FILENAME =
      "portfolio_data.csv";

  /** Max description chars in CSV. */
  static final int MAX_DESC_LENGTH = 200;

  /** File cache TTL in milliseconds (4 hours). */
  static final long CACHE_TTL_MS =
      4L * 60 * 60 * 1000;

  /** Max concurrent requests per user. */
  static final int MAX_CONCURRENT = 1;

  /** Path to the system prompt template. */
  static final String PROMPT_PATH =
      "prompts/portfolio_agent.md";

  /** Instruction for end-of-chat follow-up suggestions. */
  static final String FOLLOW_UP_SUGGESTIONS_INSTRUCTION =
      "After each answer, append exactly one metadata line "
          + "formatted as <SUGGESTIONS>[\"Question 1?\", "
          + "\"Question 2?\", \"Question 3?\"]"
          + "</SUGGESTIONS>. Use 2 to 3 concise follow-up "
          + "suggestions the user can send next, valid JSON "
          + "strings, and do not mention the tag in the visible "
          + "answer.";

  /** Top-N for summary lists. */
  static final int SUMMARY_TOP_N = 10;

  /** Company data repository. */
  private final CompanyExtractionDataRepository
      repository;
  /** OpenAI API client. */
  private final OpenAiClient openAiClient;
  /** Prompt template loader. */
  private final PromptLoader promptLoader;

  /** Cache of uploaded files and summaries. */
  private final ConcurrentHashMap<Long, CachedPortfolio>
      portfolioCache = new ConcurrentHashMap<>();

  /** Per-user active request counters. */
  private final ConcurrentHashMap<Long, AtomicInteger>
      activeRequests = new ConcurrentHashMap<>();

  /**
   * Constructor.
   *
   * @param repo the company extraction data repository
   * @param client the OpenAI client
   * @param loader the prompt template loader
   */
  public PortfolioAiAgentService(
      final CompanyExtractionDataRepository repo,
      final OpenAiClient client,
      final PromptLoader loader) {
    this.repository = repo;
    this.openAiClient = client;
    this.promptLoader = loader;
  }

  /**
   * Pre-load and cache the portfolio CSV file so
   * that subsequent chat requests are faster.
   *
   * @param portfolioId portfolio to warm up
   * @return number of companies loaded, 0 if empty
   */
  public int warmUp(final Long portfolioId) {
    CachedPortfolio cached = getValidCache(
        portfolioId);
    if (cached != null) {
      return cached.companyCount;
    }
    CachedPortfolio result = loadAndCache(
        portfolioId);
    return result != null ? result.companyCount : 0;
  }

  /**
   * Answer a question synchronously.
   *
   * @param portfolioId portfolio to query
   * @param conversation conversation messages
   * @param userId current user ID for rate limiting
   * @param effort reasoning effort (low/medium/high)
   * @param model model override (nullable)
   * @return the AI response
   */
  public PortfolioAgentResponse askQuestion(
      final Long portfolioId,
      final List<ChatMessage> conversation,
      final Long userId,
      final String effort,
      final String model) {
    validateLastMessage(conversation);
    checkConcurrency(userId);
    try {
      String eff = resolveEffort(effort);
      String mdl = resolveModel(model);
      return doAskQuestion(
          portfolioId, conversation, eff, mdl);
    } finally {
      releaseConcurrency(userId);
    }
  }

  /**
   * Answer a question with streaming via callbacks.
   *
   * @param portfolioId portfolio to query
   * @param conversation conversation messages
   * @param userId current user ID
   * @param effort reasoning effort (low/medium/high)
   * @param model model override (nullable)
   * @param cb streaming callbacks
   */
  public void askQuestionStreaming(
      final Long portfolioId,
      final List<ChatMessage> conversation,
      final Long userId,
      final String effort,
      final String model,
      final StreamCallbacks cb) {
    try {
      validateLastMessage(conversation);
      checkConcurrency(userId);
    } catch (IllegalStateException e) {
      cb.onError.accept(e.getMessage());
      return;
    }

    try {
      String eff = resolveEffort(effort);
      String mdl = resolveModel(model);
      doAskStreaming(portfolioId, conversation,
          eff, mdl, cb);
    } finally {
      releaseConcurrency(userId);
    }
  }

  /**
   * Evict expired cache entries.
   * Runs every 5 minutes.
   */
  @Scheduled(fixedRate = 300_000)
  public final void evictExpiredFiles() {
    long now = System.currentTimeMillis();
    Iterator<Map.Entry<Long, CachedPortfolio>> it =
        portfolioCache.entrySet().iterator();
    while (it.hasNext()) {
      Map.Entry<Long, CachedPortfolio> entry =
          it.next();
      CachedPortfolio cp = entry.getValue();
      if (now - cp.createdAt > CACHE_TTL_MS) {
        log.info("Evicting cached file {} for "
            + "portfolio {}",
            cp.fileId, entry.getKey());
        openAiClient.deleteFile(cp.fileId);
        it.remove();
      }
    }
  }

  /**
   * Clean up all cached files on shutdown.
   */
  @PreDestroy
  public void cleanupAllFiles() {
    for (Map.Entry<Long, CachedPortfolio> entry
        : portfolioCache.entrySet()) {
      log.info("Cleanup: deleting file {} for "
          + "portfolio {}",
          entry.getValue().fileId, entry.getKey());
      openAiClient.deleteFile(
          entry.getValue().fileId);
    }
    portfolioCache.clear();
  }

  private PortfolioAgentResponse doAskQuestion(
      final Long portfolioId,
      final List<ChatMessage> conversation,
      final String effort,
      final String model) {
    String lastQ = conversation
        .get(conversation.size() - 1).getContent();
    log.info("Agent question for portfolio {} "
        + "(effort={}, model={}): {}",
        portfolioId, effort, model, lastQ);

    CachedPortfolio cp = ensureCached(portfolioId);
    if (cp == null) {
      return PortfolioAgentResponse.builder()
          .answer("No companies found in "
              + "this portfolio.")
          .companyCount(0)
          .model(model)
          .build();
    }

    List<Map<String, String>> messages =
        buildMessages(cp.companyCount,
            cp.summary, conversation);
    String eff = isReasoningModel(model)
        ? effort : null;

    String answer = openAiClient
        .makeChatCompletionTextAdvanced(
            messages, model, true, true,
            eff, List.of(cp.fileId));

    if (answer == null || answer.isBlank()) {
      return PortfolioAgentResponse.builder()
          .answer("The model returned an empty "
              + "response. Please try rephrasing "
              + "your question.")
          .companyCount(cp.companyCount)
          .model(model)
          .build();
    }

    log.info("Agent response for portfolio {} "
        + "({} chars, {} turns, model={})",
        portfolioId, answer.length(),
        conversation.size(), model);

    return PortfolioAgentResponse.builder()
        .answer(answer)
        .companyCount(cp.companyCount)
        .model(model)
        .build();
  }

  private void doAskStreaming(
      final Long portfolioId,
      final List<ChatMessage> conversation,
      final String effort,
      final String model,
      final StreamCallbacks cb) {
    String lastQ = conversation
        .get(conversation.size() - 1).getContent();
    log.info("Agent stream for portfolio {} "
        + "(effort={}, model={}): {}",
        portfolioId, effort, model, lastQ);

    CachedPortfolio cp = ensureCached(portfolioId);
    if (cp == null) {
      cb.onDelta.accept(
          "No companies found in this portfolio.");
      cb.onComplete.accept(
          new StreamResult(0, model));
      return;
    }

    List<Map<String, String>> messages =
        buildMessages(cp.companyCount,
            cp.summary, conversation);
    String eff = isReasoningModel(model)
        ? effort : null;

    final boolean[] errored = {false};
    openAiClient.streamResponsesApi(
        messages, model, eff,
        true, true, List.of(cp.fileId),
        cb.onDelta, cb.onStatus,
        err -> {
          errored[0] = true;
          cb.onError.accept(
              "Analysis failed: "
                  + err.getMessage());
        });

    if (!errored[0]) {
      cb.onComplete.accept(
          new StreamResult(cp.companyCount, model));
    }
  }

  private CachedPortfolio ensureCached(
      final Long portfolioId) {
    CachedPortfolio cached =
        getValidCache(portfolioId);
    if (cached != null) {
      log.info("Cache hit for portfolio {} "
          + "({} companies, file {})",
          portfolioId, cached.companyCount,
          cached.fileId);
      return cached;
    }
    return loadAndCache(portfolioId);
  }

  private CachedPortfolio getValidCache(
      final Long portfolioId) {
    CachedPortfolio cached =
        portfolioCache.get(portfolioId);
    if (cached == null) {
      return null;
    }
    long now = System.currentTimeMillis();
    if ((now - cached.createdAt) >= CACHE_TTL_MS) {
      return null;
    }
    return cached;
  }

  private CachedPortfolio loadAndCache(
      final Long portfolioId) {
    Page<CompanyExtractionDataLiteProjection> page =
        repository
            .findAllAccessibleByPortfolioIdProjected(
                portfolioId,
                PageRequest.of(0, MAX_COMPANIES));

    List<CompanyExtractionDataLiteProjection> co =
        page.getContent();
    if (co.isEmpty()) {
      log.warn("No companies for portfolio {}",
          portfolioId);
      return null;
    }

    log.info("Loaded {} companies for portfolio {}",
        co.size(), portfolioId);

    String csv = formatCsvContent(co);
    byte[] bytes =
        csv.getBytes(StandardCharsets.UTF_8);
    String summary = computeSummary(co);

    CachedPortfolio old =
        portfolioCache.get(portfolioId);
    if (old != null) {
      log.info("Replacing stale cache for "
          + "portfolio {}", portfolioId);
      openAiClient.deleteFile(old.fileId);
    }

    String fileId = openAiClient.uploadFile(
        bytes, DATA_FILENAME);
    log.info("Uploaded portfolio data ({} bytes) "
        + "as {}", bytes.length, fileId);

    CachedPortfolio cp = new CachedPortfolio(
        fileId, System.currentTimeMillis(),
        co.size(), summary);
    portfolioCache.put(portfolioId, cp);
    return cp;
  }

  private void checkConcurrency(
      final Long userId) {
    if (userId == null) {
      return;
    }
    AtomicInteger count = activeRequests
        .computeIfAbsent(userId,
            k -> new AtomicInteger(0));
    if (count.incrementAndGet() > MAX_CONCURRENT) {
      count.decrementAndGet();
      throw new IllegalStateException(
          "You already have a request in progress. "
          + "Please wait for it to complete.");
    }
  }

  private void releaseConcurrency(
      final Long userId) {
    if (userId == null) {
      return;
    }
    AtomicInteger count =
        activeRequests.get(userId);
    if (count != null) {
      count.decrementAndGet();
    }
  }

  private String resolveEffort(final String effort) {
    if (effort == null || effort.isBlank()) {
      return DEFAULT_REASONING;
    }
    return effort;
  }

  private String resolveModel(final String model) {
    if (model == null || model.isBlank()) {
      return DEFAULT_MODEL;
    }
    if (!ALLOWED_MODELS.contains(model)) {
      return DEFAULT_MODEL;
    }
    return model;
  }

  private boolean isReasoningModel(
      final String model) {
    return model.startsWith("gpt-5")
        || model.startsWith("o3")
        || model.startsWith("o4");
  }

  private void validateLastMessage(
      final List<ChatMessage> conversation) {
    if (conversation == null
        || conversation.isEmpty()) {
      throw new IllegalStateException(
          "Messages must not be empty.");
    }
    ChatMessage last =
        conversation.get(conversation.size() - 1);
    if (!"user".equals(last.getRole())) {
      throw new IllegalStateException(
          "Last message must have role 'user'.");
    }
  }

  /**
   * Build the message list for the OpenAI API.
   *
   * @param companyCount number of companies
   * @param summary precomputed portfolio summary
   * @param conversation user conversation history
   * @return formatted message list
   */
  final List<Map<String, String>> buildMessages(
      final int companyCount,
      final String summary,
      final List<ChatMessage> conversation) {
    String systemPrompt =
        buildSystemPrompt(companyCount, summary);

    List<Map<String, String>> messages =
        new ArrayList<>();
    Map<String, String> sysMsg = new HashMap<>();
    sysMsg.put("role", "system");
    sysMsg.put("content", systemPrompt);
    messages.add(sysMsg);

    for (ChatMessage msg : conversation) {
      Map<String, String> m = new HashMap<>();
      m.put("role", msg.getRole());
      m.put("content", msg.getContent());
      messages.add(m);
    }

    return messages;
  }

  private String buildSystemPrompt(
      final int companyCount,
      final String summary) {
    String template =
        promptLoader.loadPrompt(PROMPT_PATH);
    String prompt = template
        .replace("{{COMPANY_COUNT}}",
            String.valueOf(companyCount))
        .replace("{{DATA_FILENAME}}",
            DATA_FILENAME);
    return prompt + "\n"
        + buildColumnDefinitions() + "\n"
        + summary + "\n"
        + FOLLOW_UP_SUGGESTIONS_INSTRUCTION;
  }

  /**
   * Compute aggregate portfolio statistics.
   *
   * @param companies the company projections
   * @return summary text for the system prompt
   */
  @SuppressWarnings("checkstyle:MethodLength")
  final String computeSummary(
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    StringBuilder sb = new StringBuilder();
    sb.append("PRECOMPUTED PORTFOLIO SUMMARY "
        + "(use to answer without code when "
        + "possible):\n");
    sb.append("Total companies: ")
        .append(companies.size()).append('\n');

    appendClusterSummary(sb, companies);
    appendEsgSummary(sb, companies);
    appendGrowthSummary(sb, companies);
    appendFundingSummary(sb, companies);
    appendTopCompanies(sb, companies);
    appendIndustrySummary(sb, companies);
    appendLocationSummary(sb, companies);
    appendPatentSummary(sb, companies);
    appendFintechSummary(sb, companies);

    return sb.toString();
  }

  private void appendClusterSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    Map<String, Long> clusters = companies.stream()
        .filter(c -> c.getClusterAssignment() != null
            && !c.getClusterAssignment().isBlank())
        .collect(Collectors.groupingBy(
            CompanyExtractionDataLiteProjection
                ::getClusterAssignment,
            Collectors.counting()));
    if (!clusters.isEmpty()) {
      sb.append("Clusters: ");
      clusters.entrySet().stream()
          .sorted(Map.Entry
              .<String, Long>comparingByValue()
              .reversed())
          .forEach(e -> sb.append(e.getKey())
              .append(" (").append(e.getValue())
              .append("), "));
      sb.setLength(sb.length() - 2);
      sb.append('\n');
    }
  }

  private void appendEsgSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    List<BigDecimal> esgVals = companies.stream()
        .map(CompanyExtractionDataLiteProjection
            ::getEsgRiskTotalAdjusted)
        .filter(v -> v != null)
        .collect(Collectors.toList());
    if (!esgVals.isEmpty()) {
      BigDecimal avg = avg(esgVals);
      BigDecimal min = esgVals.stream()
          .min(Comparator.naturalOrder()).get();
      BigDecimal max = esgVals.stream()
          .max(Comparator.naturalOrder()).get();
      sb.append("ESG Risk (0-50, lower=better): ")
          .append("avg=").append(avg)
          .append(", min=").append(dec(min))
          .append(", max=").append(dec(max))
          .append(", n=").append(esgVals.size())
          .append('\n');
    }
  }

  private void appendGrowthSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    List<BigDecimal> growthVals =
        companies.stream()
        .map(CompanyExtractionDataLiteProjection
            ::getGrowthCompositeScore)
        .filter(v -> v != null)
        .collect(Collectors.toList());
    if (!growthVals.isEmpty()) {
      BigDecimal avg = avg(growthVals);
      BigDecimal min = growthVals.stream()
          .min(Comparator.naturalOrder()).get();
      BigDecimal max = growthVals.stream()
          .max(Comparator.naturalOrder()).get();
      sb.append("Growth (0-100): ")
          .append("avg=").append(avg)
          .append(", min=").append(dec(min))
          .append(", max=").append(dec(max))
          .append(", n=").append(growthVals.size())
          .append('\n');
    }
  }

  private void appendFundingSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    List<BigDecimal> fundVals = companies.stream()
        .map(CompanyExtractionDataLiteProjection
            ::getTotalFundingAmount)
        .filter(v -> v != null
            && v.compareTo(BigDecimal.ZERO) > 0)
        .collect(Collectors.toList());
    if (!fundVals.isEmpty()) {
      BigDecimal total = fundVals.stream()
          .reduce(BigDecimal.ZERO, BigDecimal::add);
      sb.append("Funding: ")
          .append(fundVals.size())
          .append(" companies with data, total=")
          .append(dec(total)).append('\n');
    }
    long rev24 = companies.stream()
        .filter(c -> c.getAnnualSales2024() != null)
        .count();
    if (rev24 > 0) {
      sb.append("Revenue data (2024): ")
          .append(rev24)
          .append(" companies\n");
    }
  }

  private void appendTopCompanies(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    sb.append("Top ").append(SUMMARY_TOP_N)
        .append(" by growth: ");
    companies.stream()
        .filter(c ->
            c.getGrowthCompositeScore() != null)
        .sorted(Comparator.comparing(
            CompanyExtractionDataLiteProjection
                ::getGrowthCompositeScore)
            .reversed())
        .limit(SUMMARY_TOP_N)
        .forEach(c -> sb.append(
                safe(c.getCompanyName()))
            .append(" (")
            .append(dec(
                c.getGrowthCompositeScore()))
            .append("), "));
    if (sb.charAt(sb.length() - 2) == ',') {
      sb.setLength(sb.length() - 2);
    }
    sb.append('\n');

    sb.append("Top ").append(SUMMARY_TOP_N)
        .append(" by ESG risk (highest): ");
    companies.stream()
        .filter(c ->
            c.getEsgRiskTotalAdjusted() != null)
        .sorted(Comparator.comparing(
            CompanyExtractionDataLiteProjection
                ::getEsgRiskTotalAdjusted)
            .reversed())
        .limit(SUMMARY_TOP_N)
        .forEach(c -> sb.append(
                safe(c.getCompanyName()))
            .append(" (")
            .append(dec(
                c.getEsgRiskTotalAdjusted()))
            .append("), "));
    if (sb.charAt(sb.length() - 2) == ',') {
      sb.setLength(sb.length() - 2);
    }
    sb.append('\n');
  }

  private void appendIndustrySummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    Map<String, Long> industries =
        companies.stream()
        .filter(c ->
            c.getIndustrySectors() != null
            && !c.getIndustrySectors().isBlank())
        .collect(Collectors.groupingBy(
            c -> c.getIndustrySectors()
                .split(",")[0].trim(),
            Collectors.counting()));
    if (!industries.isEmpty()) {
      sb.append("Top industries: ");
      industries.entrySet().stream()
          .sorted(Map.Entry
              .<String, Long>comparingByValue()
              .reversed())
          .limit(SUMMARY_TOP_N)
          .forEach(e -> sb.append(e.getKey())
              .append(" (").append(e.getValue())
              .append("), "));
      sb.setLength(sb.length() - 2);
      sb.append('\n');
    }
  }

  private void appendLocationSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    Map<String, Long> locations =
        companies.stream()
        .filter(c ->
            c.getHeadquarterAddress() != null
            && !c.getHeadquarterAddress().isBlank())
        .collect(Collectors.groupingBy(
            c -> extractCity(
                c.getHeadquarterAddress()),
            Collectors.counting()));
    if (!locations.isEmpty()) {
      sb.append("Top locations: ");
      locations.entrySet().stream()
          .sorted(Map.Entry
              .<String, Long>comparingByValue()
              .reversed())
          .limit(SUMMARY_TOP_N)
          .forEach(e -> sb.append(e.getKey())
              .append(" (").append(e.getValue())
              .append("), "));
      sb.setLength(sb.length() - 2);
      sb.append('\n');
    }
  }

  private void appendPatentSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    int totalPat = companies.stream()
        .filter(c -> c.getTotalPatents() != null)
        .mapToInt(
            CompanyExtractionDataLiteProjection
                ::getTotalPatents)
        .sum();
    long withPat = companies.stream()
        .filter(c -> c.getTotalPatents() != null
            && c.getTotalPatents() > 0)
        .count();
    if (withPat > 0) {
      sb.append("Patents: ").append(totalPat)
          .append(" total across ")
          .append(withPat)
          .append(" companies\n");
    }
  }

  private void appendFintechSummary(
      final StringBuilder sb,
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    long fintech = companies.stream()
        .filter(c -> Boolean.TRUE
            .equals(c.getIsFintech()))
        .count();
    sb.append("Fintech flagged: ")
        .append(fintech).append('\n');
  }

  private String extractCity(final String addr) {
    if (addr == null) {
      return "Unknown";
    }
    String[] parts = addr.split(",");
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim()
          .replaceAll("\\d{4,}", "").trim();
    }
    return addr.trim();
  }

  private BigDecimal avg(
      final List<BigDecimal> vals) {
    if (vals.isEmpty()) {
      return BigDecimal.ZERO;
    }
    BigDecimal sum = vals.stream()
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return sum.divide(
        BigDecimal.valueOf(vals.size()),
        1, RoundingMode.HALF_UP);
  }

  private String buildColumnDefinitions() {
    return "COLUMNS: name, url, desc (truncated), "
        + "industry, cluster (IT/Media | "
        + "Photonics/Optics | "
        + "Biotechnology/Environment | "
        + "Microsystems/Materials | "
        + "Renewable Energy/Photovoltaics | "
        + "General - Non-Cluster), "
        + "employees, location, ceo, legal_form, "
        + "founded, geo_scope, pri_ind (NACE), "
        + "sec_ind, "
        + "esg_total (0-50 lower=better), "
        + "esg_env, esg_soc, esg_gov, "
        + "growth (0-100), gr_media, gr_sent, "
        + "gr_innov, gr_team, gr_fund, gr_age, "
        + "impact, imp_5y, imp_5yn, imp_5ynet, "
        + "imp_lk, abc (A/B/C), "
        + "fintech (yes/no), "
        + "sbmo (0-100), sbmo_a/b/c/d, "
        + "funding, currency, "
        + "s22/s23/s24 (annual revenue), "
        + "pat/pat_g/pat_a (patents), "
        + "co2/sc1/sc2/sc3 (emissions), "
        + "cert, aw1, aw2, lat, lon, tags\n";
  }

  private String formatCsvContent(
      final List<CompanyExtractionDataLiteProjection>
          companies) {
    StringBuilder sb = new StringBuilder();
    sb.append(buildHeader()).append('\n');
    for (CompanyExtractionDataLiteProjection c
        : companies) {
      sb.append(safe(c.getCompanyName()))
          .append('|');
      sb.append(safe(c.getCompanyUrl()))
          .append('|');
      sb.append(truncate(
          safe(c.getCompanyDescription()),
          MAX_DESC_LENGTH)).append('|');
      sb.append(safe(c.getIndustrySectors()))
          .append('|');
      sb.append(safe(c.getClusterAssignment()))
          .append('|');
      sb.append(safe(c.getNumberOfEmployees()))
          .append('|');
      sb.append(safe(c.getHeadquarterAddress()))
          .append('|');
      sb.append(safe(c.getCeoName()))
          .append('|');
      sb.append(safe(c.getLegalForm()))
          .append('|');
      sb.append(
          safe(c.getLegalEntityFormationDate()))
          .append('|');
      sb.append(
          safe(c.getGeographicScopeEstimated()))
          .append('|');
      sb.append(
          safe(c.getPrimaryIndustryStandard()))
          .append('|');
      sb.append(
          safe(c.getSecondaryIndustryStandard()))
          .append('|');
      appendScores(sb, c);
      appendFundingAndRevenue(sb, c);
      appendPatentsAndEmissions(sb, c);
      sb.append(safe(c.getCertificationName()))
          .append('|');
      sb.append(safe(c.getPrizeAwardName1()))
          .append('|');
      sb.append(safe(c.getPrizeAwardName2()))
          .append('|');
      appendGeo(sb, c);
      sb.append(formatTags(c.getTags()));
      sb.append('\n');
    }
    return sb.toString();
  }

  private void appendScores(
      final StringBuilder sb,
      final CompanyExtractionDataLiteProjection c) {
    sb.append(dec(c.getEsgRiskTotalAdjusted()))
        .append('|');
    sb.append(
        dec(c.getEsgRiskEnvironmentalAdjusted()))
        .append('|');
    sb.append(dec(c.getEsgRiskSocialAdjusted()))
        .append('|');
    sb.append(
        dec(c.getEsgRiskGovernanceAdjusted()))
        .append('|');
    sb.append(dec(c.getGrowthCompositeScore()))
        .append('|');
    sb.append(dec(c.getGrowthMediaReachScore()))
        .append('|');
    sb.append(dec(c.getGrowthSentimentScore()))
        .append('|');
    sb.append(dec(
        c.getGrowthInnovationVisibilityScore()))
        .append('|');
    sb.append(
        dec(c.getGrowthTeamStrengthScore()))
        .append('|');
    sb.append(
        dec(c.getGrowthFundingVelocityScore()))
        .append('|');
    sb.append(dec(c.getGrowthCompanyAgeScore()))
        .append('|');
    sb.append(
        dec(c.getOverallImpactPotentialScore()))
        .append('|');
    sb.append(dec(c.getImpactMagnitude5Year()))
        .append('|');
    sb.append(
        dec(c.getImpactMagnitude5YearNegative()))
        .append('|');
    sb.append(
        dec(c.getImpactMagnitude5YearNet()))
        .append('|');
    sb.append(dec(c.getImpactLikelihood()))
        .append('|');
    sb.append(
        safe(c.getHighestAbcClassification()))
        .append('|');
    sb.append(bool(c.getIsFintech()))
        .append('|');
    sb.append(dec(c.getSbmoTotalScore()))
        .append('|');
    sb.append(dec(c.getSbmoCriteriaAScore()))
        .append('|');
    sb.append(dec(c.getSbmoCriteriaBScore()))
        .append('|');
    sb.append(dec(c.getSbmoCriteriaCScore()))
        .append('|');
    sb.append(dec(c.getSbmoCriteriaDScore()))
        .append('|');
  }

  private void appendFundingAndRevenue(
      final StringBuilder sb,
      final CompanyExtractionDataLiteProjection c) {
    sb.append(dec(c.getTotalFundingAmount()))
        .append('|');
    sb.append(safe(c.getFundingCurrency()))
        .append('|');
    sb.append(dec(c.getAnnualSales2022()))
        .append('|');
    sb.append(dec(c.getAnnualSales2023()))
        .append('|');
    sb.append(dec(c.getAnnualSales2024()))
        .append('|');
  }

  private void appendPatentsAndEmissions(
      final StringBuilder sb,
      final CompanyExtractionDataLiteProjection c) {
    sb.append(intVal(c.getTotalPatents()))
        .append('|');
    sb.append(intVal(c.getGrantedPatents()))
        .append('|');
    sb.append(intVal(c.getPatentApplications()))
        .append('|');
    sb.append(safe(c.getTotalCarbonEmissions()))
        .append('|');
    sb.append(safe(c.getScope1Emissions()))
        .append('|');
    sb.append(safe(c.getScope2Emissions()))
        .append('|');
    sb.append(safe(c.getScope3Emissions()))
        .append('|');
  }

  private void appendGeo(
      final StringBuilder sb,
      final CompanyExtractionDataLiteProjection c) {
    sb.append(dbl(c.getLatitude())).append('|');
    sb.append(dbl(c.getLongitude())).append('|');
  }

  private String buildHeader() {
    return "name|url|desc|industry|cluster"
        + "|employees|location|ceo|legal_form"
        + "|founded|geo_scope|pri_ind|sec_ind"
        + "|esg_total|esg_env|esg_soc|esg_gov"
        + "|growth|gr_media|gr_sent|gr_innov"
        + "|gr_team|gr_fund|gr_age"
        + "|impact|imp_5y|imp_5yn"
        + "|imp_5ynet|imp_lk|abc"
        + "|fintech|sbmo|sbmo_a|sbmo_b"
        + "|sbmo_c|sbmo_d"
        + "|funding|currency"
        + "|s22|s23|s24"
        + "|pat|pat_g|pat_a"
        + "|co2|sc1|sc2|sc3"
        + "|cert|aw1|aw2|lat|lon|tags";
  }

  private String safe(final String val) {
    if (val == null) {
      return "";
    }
    return val.replace("|", "/")
        .replace("\n", " ")
        .replace("\r", "");
  }

  private String truncate(
      final String val, final int max) {
    if (val == null || val.length() <= max) {
      return val == null ? "" : val;
    }
    return val.substring(0, max) + "...";
  }

  private String dec(final BigDecimal val) {
    if (val == null) {
      return "";
    }
    return val.stripTrailingZeros().toPlainString();
  }

  private String intVal(final Integer val) {
    if (val == null) {
      return "";
    }
    return val.toString();
  }

  private String dbl(final Double val) {
    if (val == null) {
      return "";
    }
    return String.valueOf(val);
  }

  private String bool(final Boolean val) {
    if (val == null) {
      return "";
    }
    return val ? "yes" : "no";
  }

  private String formatTags(
      final List<String> tags) {
    if (tags == null || tags.isEmpty()) {
      return "";
    }
    return String.join(",", tags);
  }

  /**
   * Callbacks for streaming responses.
   */
  public static class StreamCallbacks {
    /** Called for each text delta. */
    final Consumer<String> onDelta;
    /** Called for tool status updates. */
    final Consumer<String> onStatus;
    /** Called when streaming completes. */
    final Consumer<StreamResult> onComplete;
    /** Called on error. */
    final Consumer<String> onError;

    /**
     * Create streaming callbacks.
     *
     * @param delta text delta callback
     * @param status tool status callback
     * @param complete completion callback
     * @param error error callback
     */
    public StreamCallbacks(
        final Consumer<String> delta,
        final Consumer<String> status,
        final Consumer<StreamResult> complete,
        final Consumer<String> error) {
      this.onDelta = delta;
      this.onStatus = status;
      this.onComplete = complete;
      this.onError = error;
    }
  }

  /**
   * Result metadata sent after streaming completes.
   */
  public static class StreamResult {
    /** Number of companies analyzed. */
    private final int companyCount;
    /** Model used. */
    private final String model;

    /**
     * Create a stream result.
     *
     * @param count company count
     * @param mdl model name
     */
    public StreamResult(final int count,
        final String mdl) {
      this.companyCount = count;
      this.model = mdl;
    }

    /**
     * Get company count.
     * @return count
     */
    public int getCompanyCount() {
      return companyCount;
    }

    /**
     * Get model.
     * @return model name
     */
    public String getModel() {
      return model;
    }
  }

  private static final class CachedPortfolio {
    /** OpenAI file ID. */
    private final String fileId;
    /** When the file was cached. */
    private final long createdAt;
    /** Number of companies in the file. */
    private final int companyCount;
    /** Precomputed stats summary text. */
    private final String summary;

    CachedPortfolio(final String fId,
        final long created,
        final int count,
        final String sum) {
      this.fileId = fId;
      this.createdAt = created;
      this.companyCount = count;
      this.summary = sum;
    }
  }
}
