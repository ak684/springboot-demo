package io.ventureplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.service.CompanyPolarChartService;
import io.ventureplatform.service.CompanyPolarChartService.PolarChartResponse;
import io.ventureplatform.service.CompanyPolarChartService.PolarMetric;
import io.ventureplatform.service.external.OpenAiClient;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates narrative insights for the portfolio polar chart section using LLM.
 * The generated text is cached on {@link CompanyExtractionData} to avoid redundant calls.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyPortfolioNarrativeService {

  private static final int SMALL_PORTFOLIO_THRESHOLD = 8;
  private static final String SYSTEM_PROMPT =
      "You are an analyst for writing concise, insightful narrative insights for portfolio managers. "
      + "Write two concise sentences (maximum) for each section: strengths, weaknesses, impact, potential_needs. "
      + "Use only the supplied company context, polar percentiles, and absolute metrics. "
      + "Do not invent data, do not mention percentile numbers or the exact portfolio rank explicitly, "
      + "and avoid bullet lists or headings. Respond with clean JSON containing the keys "
      + "\"strengths\", \"weaknesses\", \"impact\", \"potential_needs\".";
  private static final int MAX_OUTPUT_TOKENS = 1200;

  private final CompanyExtractionDataRepository companyRepository;
  private final CompanyPolarChartService companyPolarChartService;
  private final OpenAiClient openAiClient;
  private final ObjectMapper objectMapper;

  /**
   * Retrieve or generate narrative text for a company.
   *
   * @param companyId company identifier
   * @param polarData cached polar chart response
   * @return narrative text bundle
   */
  @Transactional
  public NarrativeTexts getOrGenerateNarrative(final Long companyId,
                                               final PolarChartResponse polarData) {
    CompanyExtractionData company = companyRepository.findById(companyId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found with ID: " + companyId));

    if (hasFreshNarrative(company)) {
      NarrativeTexts cached = NarrativeTexts.fromEntity(company);
      if (cached != null) {
        return cached;
      }
    }

    NarrativeTexts generated = generateNarrative(company, polarData);
    if (generated != null) {
      company.setPortfolioStrengthsText(generated.getStrengths());
      company.setPortfolioWeaknessesText(generated.getWeaknesses());
      company.setPortfolioImpactText(generated.getImpact());
      company.setPortfolioPotentialNeedsText(generated.getPotentialNeeds());
      company.setPortfolioNarrativeGeneratedAt(
          Date.from(generated.getGeneratedAt()));
      companyRepository.save(company);
      return generated;
    }

    // Fall back to existing text even if stale to keep UI populated.
    return NarrativeTexts.fromEntity(company);
  }

  /**
   * Generate narrative using latest metrics asynchronously.
   *
   * @param companyId company identifier
   */
  @Async
  public void generateNarrativeAsync(final Long companyId) {
    try {
      log.info("Triggering async narrative generation for company {}", companyId);
      PolarChartResponse polarData =
          companyPolarChartService.getPolarChart(companyId);
      getOrGenerateNarrative(companyId, polarData);
    } catch (Exception e) {
      log.error("Failed async narrative generation for company {}: {}",
          companyId, e.getMessage(), e);
    }
  }

  /**
   * Force regeneration of the narrative for a company by clearing the cached
   * timestamp and synchronously regenerating against the latest polar data.
   *
   * @param companyId company identifier
   * @return true if a fresh narrative was produced
   */
  @Transactional
  public boolean forceRegenerateNarrative(final Long companyId) {
    CompanyExtractionData company = companyRepository.findById(companyId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found with ID: " + companyId));
    company.setPortfolioNarrativeGeneratedAt(null);
    companyRepository.save(company);

    PolarChartResponse polarData =
        companyPolarChartService.getPolarChart(companyId);
    NarrativeTexts generated = getOrGenerateNarrative(companyId, polarData);
    return generated != null
        && generated.getGeneratedAt() != null;
  }

  private boolean hasFreshNarrative(final CompanyExtractionData company) {
    if (company.getPortfolioNarrativeGeneratedAt() == null) {
      return false;
    }
    Instant generatedAt = company.getPortfolioNarrativeGeneratedAt()
        .toInstant();
    return StringUtils.isNotBlank(company.getPortfolioStrengthsText())
        && StringUtils.isNotBlank(company.getPortfolioWeaknessesText())
        && StringUtils.isNotBlank(company.getPortfolioImpactText())
        && StringUtils.isNotBlank(company.getPortfolioPotentialNeedsText());
  }

  private NarrativeTexts generateNarrative(final CompanyExtractionData company,
                                           final PolarChartResponse polarData) {
    if (polarData == null || polarData.getMetrics() == null
        || polarData.getMetrics().isEmpty()) {
      log.debug("Skipping narrative generation for company {} due to missing metrics",
          company.getId());
      return null;
    }

    try {
      boolean smallPortfolio = isSmallPortfolio(polarData);
      String userPrompt = buildUserPrompt(company, polarData, smallPortfolio);
      String rawResponse = openAiClient.makeO3CallWithWebSearch(
          SYSTEM_PROMPT,
          userPrompt,
          MAX_OUTPUT_TOKENS,
          true);
      NarrativeTexts parsed = parseResponse(rawResponse);
      if (parsed != null) {
        return parsed.withGeneratedAt(Instant.now());
      }
    } catch (Exception e) {
      log.error("Failed to generate portfolio narrative for company {}: {}",
          company.getId(), e.getMessage(), e);
    }
    return null;
  }

  private boolean isSmallPortfolio(final PolarChartResponse polarData) {
    Integer rankedCount = polarData.getRankedCompanyCount();
    if (rankedCount != null && rankedCount > 0) {
      return rankedCount < SMALL_PORTFOLIO_THRESHOLD;
    }
    int sampleSize = polarData.getSampleSize();
    return sampleSize > 0 && sampleSize < SMALL_PORTFOLIO_THRESHOLD;
  }

  private String buildUserPrompt(final CompanyExtractionData company,
                                 final PolarChartResponse polarData,
                                 final boolean smallPortfolio) {
    StringBuilder prompt = new StringBuilder();
    prompt.append("Company overview:\n");
    prompt.append("- Name: ").append(defaultString(company.getCompanyName()))
        .append("\n");
    prompt.append("- Description: ")
        .append(defaultString(company.getCompanyDescription()))
        .append("\n");
    prompt.append("- Industry sectors: ")
        .append(defaultString(company.getIndustrySectors()))
        .append("\n");
    prompt.append("- Cluster: ")
        .append(defaultString(company.getClusterAssignment()))
        .append("\n");

    if (polarData.getVenturePlatformScore() != null) {
      prompt.append("- Average percentile across metrics (context only): ")
          .append(formatPercent(polarData.getVenturePlatformScore()))
          .append("\n");
    }
    if (polarData.getPortfolioRank() != null
        && polarData.getRankedCompanyCount() != null) {
      prompt.append("- Portfolio rank context: ")
          .append(polarData.getPortfolioRank())
          .append("/")
          .append(polarData.getRankedCompanyCount())
          .append(" (for your analysis only, do not quote rank verbatim)\n");
    }
    if (smallPortfolio) {
      prompt.append("- The portfolio sample is small, so note limitations "
          + "when appropriate.\n");
    }

    prompt.append("\nTop percentile strengths:\n");
    buildMetricList(polarData, prompt, Comparator
        .comparing(PolarMetric::getPercentile)
        .reversed(),
        value -> value >= 0.7,
        "None identified");

    prompt.append("\nLowest percentile areas:\n");
    buildMetricList(polarData, prompt, Comparator
        .comparing(PolarMetric::getPercentile),
        value -> value <= 0.3,
        "None identified");

    prompt.append("\nImpact metrics:\n");
    appendCategoryMetrics(polarData, prompt, "Impact potential");
    prompt.append("\nRisk and emissions metrics:\n");
    appendCategoryMetrics(polarData, prompt, "ESG risk");
    appendCategoryMetrics(polarData, prompt, "Emissions");

    prompt.append("\nAbsolute company facts:\n");
    for (String fact : buildAbsoluteFacts(company)) {
      prompt.append("- ").append(fact).append("\n");
    }

    List<String> sustainabilityInsights = buildSustainabilityInsights(company);
    if (!sustainabilityInsights.isEmpty()) {
      prompt.append("\nSustainability and impact context:\n");
      sustainabilityInsights.forEach(line -> prompt.append("- ")
          .append(line)
          .append("\n"));
    }

    List<String> coreServices = buildCoreProductsSummary(company.getCoreProductsServices());
    if (!coreServices.isEmpty()) {
      prompt.append("\nCore products and services:\n");
      coreServices.forEach(line -> prompt.append("- ").append(line).append("\n"));
    }

    List<String> businessInsights = buildBusinessContext(company.getRawExtractionData());
    if (!businessInsights.isEmpty()) {
      prompt.append("\nBusiness model and market context:\n");
      businessInsights.forEach(line -> prompt.append("- ")
          .append(line)
          .append("\n"));
    }

    prompt.append("\nWrite concise narrative text for each requested section. "
        + "Focus on insight rather than restating the raw numbers.\n");
    return prompt.toString();
  }

  private void buildMetricList(final PolarChartResponse polarData,
                               final StringBuilder prompt,
                               final Comparator<PolarMetric> comparator,
                               final java.util.function.Predicate<Double> filter,
                               final String emptyMessage) {
    List<String> lines = polarData.getMetrics().stream()
        .filter(metric -> !metric.isMissing())
        .filter(metric -> metric.getPercentile() != null)
        .filter(metric -> filter.test(metric.getPercentile()))
        .sorted(comparator)
        .map(metric -> metric.getLabel()
            + " ("
            + metric.getCategory()
            + ", percentile "
            + formatPercent(metric.getPercentile())
            + ", value "
            + resolveMetricValue(metric)
            + ")")
        .collect(Collectors.toList());
    if (lines.isEmpty()) {
      prompt.append("- ").append(emptyMessage).append("\n");
      return;
    }
    lines.forEach(line -> prompt.append("- ").append(line).append("\n"));
  }

  private void appendCategoryMetrics(final PolarChartResponse polarData,
                                     final StringBuilder prompt,
                                     final String category) {
    List<String> lines = polarData.getMetrics().stream()
        .filter(metric -> !metric.isMissing())
        .filter(metric -> Objects.equals(category, metric.getCategory()))
        .filter(metric -> metric.getPercentile() != null)
        .sorted(Comparator.comparing(PolarMetric::getPercentile).reversed())
        .map(metric -> metric.getLabel()
            + " - percentile "
            + formatPercent(metric.getPercentile())
            + ", value "
            + resolveMetricValue(metric))
        .collect(Collectors.toList());
    if (lines.isEmpty()) {
      prompt.append("- None\n");
      return;
    }
    lines.forEach(line -> prompt.append("- ").append(line).append("\n"));
  }

  private List<String> buildAbsoluteFacts(final CompanyExtractionData company) {
    List<String> facts = new ArrayList<>();
    addFact(facts, "Employees", defaultString(company.getNumberOfEmployees()));
    addFact(facts, "Latest annual sales (2024)",
        formatMoney(company.getAnnualSales2024(), company.getCurrency2024()));
    addFact(facts, "Total funding",
        formatMoney(company.getTotalFundingAmount(),
            company.getFundingCurrency()));
    addFact(facts, "Scope 1 emissions",
        defaultString(company.getScope1Emissions()));
    addFact(facts, "Scope 2 emissions",
        defaultString(company.getScope2Emissions()));
    addFact(facts, "Scope 3 emissions",
        defaultString(company.getScope3Emissions()));
    addFact(facts, "Total emissions",
        defaultString(company.getTotalCarbonEmissions()));
    addFact(facts, "Adjusted ESG risk score",
        formatDecimal(company.getEsgRiskTotalAdjusted()));
    addFact(facts, "Inherent ESG risk score",
        formatDecimal(company.getEsgRiskTotalInherent()));

    // Only include foresight score if company qualified for it
    if (Boolean.TRUE.equals(company.getEsgForesightQualified())) {
      addFact(facts, "Foresight ESG risk score",
          formatDecimal(company.getEsgRiskTotalForesight()));
    }

    addFact(facts, "Impact magnitude (5y)",
        formatDecimal(company.getImpactMagnitude5Year()));
    addFact(facts, "Impact likelihood",
        formatDecimal(company.getImpactLikelihood()));
    addFact(facts, "Overall impact potential score",
        formatDecimal(company.getOverallImpactPotentialScore()));
    return facts;
  }

  private List<String> buildSustainabilityInsights(
      final CompanyExtractionData company) {
    List<String> lines = new ArrayList<>();
    addIfPresent(lines, "Sustainability orientation",
        company.getSustainabilityOrientation());
    addIfPresent(lines, "Sustainability impact focus",
        company.getSustainabilityImpactArea());
    addIfPresent(lines, "Theory of change highlight",
        company.getTheoryOfChange());
    addIfPresent(lines, "Problem statement", company.getProblemDescription());
    addIfPresent(lines, "Innovation description",
        company.getInnovationDescription());
    addIfPresent(lines, "Target stakeholders",
        company.getTargetStakeholders());
    addIfPresent(lines, "Impact geography", company.getGeographyOfImpact());
    addIfPresent(lines, "Estimated geographic scope",
        company.getGeographicScopeEstimated());
    addIfPresent(lines, "Cluster rationale",
        company.getClusterJustification());
    addIfPresent(lines, "SDG alignment", company.getSdgs());
    addIfPresent(lines, "SBMO criterion A insight",
        company.getSbmoCriteriaAExplanation());
    addIfPresent(lines, "SBMO criterion B insight",
        company.getSbmoCriteriaBExplanation());
    addIfPresent(lines, "SBMO criterion C insight",
        company.getSbmoCriteriaCExplanation());
    addIfPresent(lines, "SBMO criterion D insight",
        company.getSbmoCriteriaDExplanation());
    return lines;
  }

  private List<String> buildCoreProductsSummary(final Map<String, Object> coreProducts) {
    List<String> lines = new ArrayList<>();
    if (coreProducts == null || coreProducts.isEmpty()) {
      return lines;
    }
    Object summary = coreProducts.get("solution_summary");
    if (summary instanceof String && StringUtils.isNotBlank((String) summary)) {
      lines.add("Solution summary: " + ((String) summary).trim());
    }

    Object productsObj = coreProducts.get("core_products");
    if (productsObj instanceof List<?>) {
      List<?> products = (List<?>) productsObj;
      int index = 1;
      for (Object productObj : products) {
        if (!(productObj instanceof Map<?, ?>)) {
          continue;
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> product = (Map<String, Object>) productObj;
        String name = safeString(product.get("name"), "Unnamed product");
        String customerSegment = safeString(product.get("customer_segment"), null);
        String valueProp = safeString(product.get("value_proposition"), null);
        String description = safeString(product.get("description"), null);

        StringBuilder builder = new StringBuilder();
        builder.append("Product ").append(index).append(": ").append(name);
        if (StringUtils.isNotBlank(customerSegment)) {
          builder.append(" for ").append(customerSegment.trim());
        }
        if (StringUtils.isNotBlank(valueProp)) {
          builder.append(" delivering ").append(valueProp.trim());
        }
        if (StringUtils.isNotBlank(description)) {
          builder.append(" (" + description.trim() + ")");
        }
        lines.add(builder.toString());
        index++;
      }
    }
    return lines;
  }

  private List<String> buildBusinessContext(final Map<String, Object> rawData) {
    List<String> lines = new ArrayList<>();
    if (rawData == null || rawData.isEmpty()) {
      return lines;
    }
    addIfPresent(lines, "Mission", extractRawField(rawData, "mission"));
    addIfPresent(lines, "Business model", extractRawField(rawData, "business_model"));
    addIfPresent(lines, "Target market", extractRawField(rawData, "target_market"));
    addIfPresent(lines, "Revenue model", extractRawField(rawData, "revenue_model"));
    addIfPresent(lines, "Funding stage", extractRawField(rawData, "funding_stage"));
    addIfPresent(lines, "Key investors", extractRawField(rawData, "key_investors"));
    addIfPresent(lines, "Strategic partnerships", extractRawField(rawData, "partnerships"));
    addIfPresent(lines, "Go-to-market strategy",
        extractRawField(rawData, "go_to_market_strategy"));
    addIfPresent(lines, "Growth strategy",
        extractRawField(rawData, "growth_strategy"));
    addIfPresent(lines, "Evidence of traction",
        extractRawField(rawData, "evidence"));
    addIfPresent(lines, "Challenges", extractRawField(rawData, "challenges"));
    return lines;
  }

  private void addIfPresent(final List<String> lines,
                            final String label,
                            final String value) {
    if (StringUtils.isBlank(value)) {
      return;
    }
    String trimmed = value.trim();
    if (trimmed.isEmpty() || "n/a".equalsIgnoreCase(trimmed)) {
      return;
    }
    lines.add(label + ": " + truncate(trimmed));
  }

  private void addFact(final List<String> facts,
                       final String label,
                       final String value) {
    if (StringUtils.isBlank(value)) {
      return;
    }
    String trimmed = value.trim();
    if (trimmed.isEmpty() || "n/a".equalsIgnoreCase(trimmed)) {
      return;
    }
    facts.add(label + ": " + trimmed);
  }

  private String extractRawField(final Map<String, Object> rawData,
                                 final String key) {
    if (rawData == null || !rawData.containsKey(key)) {
      return null;
    }
    Object value = rawData.get(key);
    if (value instanceof String) {
      return truncate((String) value);
    }
    if (value instanceof Collection<?>) {
      Collection<?> collection = (Collection<?>) value;
      List<String> parts = collection.stream()
          .map(item -> item == null ? "" : item.toString())
          .filter(StringUtils::isNotBlank)
          .map(String::trim)
          .collect(Collectors.toList());
      if (parts.isEmpty()) {
        return null;
      }
      return truncate(String.join("; ", parts));
    }
    return truncate(value.toString());
  }

  private String truncate(final String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    int maxLength = 400;
    if (trimmed.length() <= maxLength) {
      return trimmed;
    }
    return trimmed.substring(0, maxLength) + "...";
  }

  private String safeString(final Object value, final String fallback) {
    if (value instanceof String && StringUtils.isNotBlank((String) value)) {
      return ((String) value).trim();
    }
    return fallback;
  }

  private NarrativeTexts parseResponse(final String rawResponse) {
    try {
      JsonNode node = objectMapper.readTree(rawResponse);
      String strengths = getJsonText(node, "strengths");
      String weaknesses = getJsonText(node, "weaknesses");
      String impact = getJsonText(node, "impact");
      String potentialNeeds = getJsonText(node, "potential_needs");
      if (StringUtils.isAnyBlank(strengths, weaknesses, impact, potentialNeeds)) {
        log.warn("Incomplete narrative response: {}", rawResponse);
        return null;
      }
      return new NarrativeTexts(strengths.trim(),
          weaknesses.trim(),
          impact.trim(),
          potentialNeeds.trim(),
          Instant.now());
    } catch (Exception e) {
      log.error("Failed to parse narrative response: {}", e.getMessage());
      return null;
    }
  }

  private String getJsonText(final JsonNode node, final String fieldName) {
    JsonNode field = node.get(fieldName);
    if (field == null || field.isNull()) {
      return null;
    }
    return field.asText();
  }

  private String formatPercent(final double value) {
    return Integer.toString((int) Math.round(value * 100));
  }

  private String formatMoney(final java.math.BigDecimal amount,
                             final String currency) {
    if (amount == null) {
      return "n/a";
    }
    String formatted = NumberFormat.getNumberInstance(Locale.US)
        .format(amount.doubleValue());
    return currency == null ? formatted : currency + " " + formatted;
  }

  private String formatDecimal(final java.math.BigDecimal value) {
    if (value == null) {
      return "n/a";
    }
    NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
    format.setMaximumFractionDigits(2);
    return format.format(value);
  }

  private String resolveMetricValue(final PolarMetric metric) {
    if (StringUtils.isNotBlank(metric.getFormattedValue())) {
      return metric.getFormattedValue().trim();
    }
    if (metric.getRawValue() != null) {
      return NumberFormat.getNumberInstance(Locale.US)
          .format(metric.getRawValue());
    }
    return "n/a";
  }

  private String defaultString(final String value) {
    return StringUtils.isBlank(value) ? "n/a" : value.trim();
  }

  @Data
  @AllArgsConstructor
  public static class NarrativeTexts {
    private final String strengths;
    private final String weaknesses;
    private final String impact;
    private final String potentialNeeds;
    private final Instant generatedAt;

    NarrativeTexts withGeneratedAt(final Instant timestamp) {
      return new NarrativeTexts(
          strengths,
          weaknesses,
          impact,
          potentialNeeds,
          timestamp
      );
    }

    static NarrativeTexts fromEntity(final CompanyExtractionData entity) {
      if (entity == null) {
        return null;
      }
      String strengths = entity.getPortfolioStrengthsText();
      String weaknesses = entity.getPortfolioWeaknessesText();
      String impact = entity.getPortfolioImpactText();
      String potentialNeeds = entity.getPortfolioPotentialNeedsText();
      if (StringUtils.isAllBlank(strengths, weaknesses, impact, potentialNeeds)) {
        return null;
      }
      Instant generatedAt = entity.getPortfolioNarrativeGeneratedAt() == null
          ? null
          : entity.getPortfolioNarrativeGeneratedAt().toInstant();
      return new NarrativeTexts(
          strengths,
          weaknesses,
          impact,
          potentialNeeds,
          generatedAt
      );
    }
  }
}
