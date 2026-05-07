package io.ventureplatform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.service.external.ImpactAiService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Backfills stakeholder geography summaries for existing companies.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeographySummaryBackfillService {

  private static final int PAGE_SIZE = 50;
  private static final int DEFAULT_PARALLEL_THREADS = 15;

  private final CompanyExtractionDataRepository companyRepository;
  private final ImpactAiService impactAiService;
  private final ObjectMapper objectMapper;

  /**
   * Backfill geography summaries for companies missing them.
   *
   * @param limit max companies to process (null = all)
   * @param parallelThreads number of parallel threads (default 5)
   * @return summary of the operation
   */
  public Map<String, Object> backfillGeographySummaries(
      final Integer limit,
      final Integer parallelThreads) {
    int threads = parallelThreads != null && parallelThreads > 0
        ? parallelThreads : DEFAULT_PARALLEL_THREADS;
    log.info("Starting geography summary backfill. Limit: {}, Parallel threads: {}",
        limit, threads);

    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger failureCount = new AtomicInteger(0);
    AtomicInteger skippedCount = new AtomicInteger(0);
    AtomicInteger processedCount = new AtomicInteger(0);
    List<Map<String, Object>> results = Collections.synchronizedList(
        new ArrayList<>());

    ExecutorService executor = Executors.newFixedThreadPool(threads);

    try {
      int pageNumber = 0;

      while (limit == null || processedCount.get() < limit) {
        Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
        Page<CompanyExtractionData> page = companyRepository
            .findCompaniesMissingGeographySummary(pageable);

        if (page.isEmpty()) {
          break;
        }

        List<CompanyExtractionData> batch = page.getContent();
        List<CompanyExtractionData> toProcess = new ArrayList<>();

        for (CompanyExtractionData company : batch) {
          if (limit != null && processedCount.get() + toProcess.size() >= limit) {
            break;
          }
          toProcess.add(company);
        }

        if (!toProcess.isEmpty()) {
          log.info("Processing batch of {} companies in parallel (page {})",
              toProcess.size(), pageNumber);

          List<CompletableFuture<Void>> futures = toProcess.stream()
              .map(company -> CompletableFuture.runAsync(() -> {
                Map<String, Object> result = processCompany(company);
                results.add(result);

                if (Boolean.TRUE.equals(result.get("success"))) {
                  successCount.incrementAndGet();
                } else if (Boolean.TRUE.equals(result.get("skipped"))) {
                  skippedCount.incrementAndGet();
                } else {
                  failureCount.incrementAndGet();
                }

                processedCount.incrementAndGet();
              }, executor))
              .collect(Collectors.toList());

          CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        }

        if (!page.hasNext() || (limit != null && processedCount.get() >= limit)) {
          break;
        }
        pageNumber++;
      }
    } finally {
      executor.shutdown();
    }

    Map<String, Object> summary = new HashMap<>();
    summary.put("total_processed", processedCount.get());
    summary.put("success_count", successCount.get());
    summary.put("failure_count", failureCount.get());
    summary.put("skipped_count", skippedCount.get());
    summary.put("parallel_threads", threads);
    summary.put("details", results);

    log.info("Backfill complete. Processed: {}, Success: {}, Failed: {}, "
            + "Skipped: {} (parallel with {} threads)",
        processedCount.get(), successCount.get(), failureCount.get(),
        skippedCount.get(), threads);

    return summary;
  }

  @Transactional
  private Map<String, Object> processCompany(final CompanyExtractionData company) {
    Map<String, Object> result = new HashMap<>();
    result.put("company_id", company.getId());
    result.put("company_name", company.getCompanyName());

    try {
      Map<String, Object> rawDataMap = company.getRawExtractionData();
      if (rawDataMap == null || rawDataMap.isEmpty()) {
        result.put("skipped", true);
        result.put("reason", "No raw data");
        return result;
      }

      JsonNode rawData = objectMapper.valueToTree(rawDataMap);
      JsonNode tocData = rawData.path("theory_of_change");
      JsonNode scoringData = rawData.path("impact_scoring");

      if (!tocData.isArray() || !scoringData.isArray()
          || tocData.size() == 0 || scoringData.size() == 0) {
        result.put("skipped", true);
        result.put("reason", "No ToC/scoring data");
        return result;
      }

      String contextJson = buildContext(
          company.getCompanyName(), tocData, scoringData);
      String response = impactAiService
          .generateStakeholderGeographySummary(contextJson);
      String cleaned = cleanJsonResponse(response);
      JsonNode parsed = objectMapper.readTree(cleaned);

      if (parsed.has("claims") && parsed.get("claims").isArray()) {
        ArrayNode claims = (ArrayNode) parsed.get("claims");
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < claims.size() && i < 3; i++) {
          if (i > 0) {
            summary.append(" ");
          }
          summary.append(claims.get(i).asText());
        }

        company.setStakeholderGeographySummary(summary.toString());
        companyRepository.save(company);

        result.put("success", true);
        result.put("summary", summary.toString());
        log.info("Generated summary for {}", company.getCompanyName());
      } else {
        result.put("success", false);
        result.put("reason", "Invalid AI response format");
      }
    } catch (Exception e) {
      log.error("Failed for {}: {}", company.getCompanyName(), e.getMessage());
      result.put("success", false);
      result.put("error", e.getMessage());
    }

    return result;
  }

  private String buildContext(
      final String companyName,
      final JsonNode tocData,
      final JsonNode scoringData) throws JsonProcessingException {
    ObjectNode context = objectMapper.createObjectNode();
    context.put("company_name", companyName != null ? companyName : "");
    context.set("theory_of_change", tocData);
    context.set("impact_scoring", scoringData);

    Map<String, Double> positiveByRegion = new HashMap<>();
    Map<String, Double> negativeByRegion = new HashMap<>();
    List<String> globalCommunityImpacts = new ArrayList<>();

    int tocIndex = 0;
    for (JsonNode toc : tocData) {
      boolean isPositive = !toc.path("type").asText("")
          .toLowerCase().contains("negative");
      String stakeholders = toc.path("stakeholders").asText("");
      String change = toc.path("change").asText("");

      JsonNode scoring = null;
      for (JsonNode s : scoringData) {
        if (s.path("id").asInt() == tocIndex + 1) {
          scoring = s;
          break;
        }
      }

      if (scoring != null) {
        JsonNode geoNode = scoring.path("geography");
        double magnitude = scoring.path("degreeOfChange").asDouble(50)
            * scoring.path("scalability").asDouble(5) / 50.0;

        if (geoNode.isArray() && geoNode.size() > 0) {
          for (JsonNode geo : geoNode) {
            String region = geo.asText("");
            if (region.equalsIgnoreCase("GLOBAL_COMMUNITY")
                || region.equalsIgnoreCase("GLOBAL")) {
              globalCommunityImpacts.add(stakeholders + ": " + change);
            } else if (!region.isEmpty()) {
              Map<String, Double> target =
                  isPositive ? positiveByRegion : negativeByRegion;
              target.merge(region, magnitude, Double::sum);
            }
          }
        }
      }
      tocIndex++;
    }

    ArrayNode positiveRegions = objectMapper.createArrayNode();
    positiveByRegion.entrySet().stream()
        .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
        .limit(5)
        .forEach(e -> positiveRegions.add(e.getKey()));

    ArrayNode negativeRegions = objectMapper.createArrayNode();
    negativeByRegion.entrySet().stream()
        .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
        .limit(3)
        .forEach(e -> negativeRegions.add(e.getKey()));

    ArrayNode globalImpacts = objectMapper.createArrayNode();
    globalCommunityImpacts.forEach(globalImpacts::add);

    context.set("positive_regions", positiveRegions);
    context.set("negative_regions", negativeRegions);
    context.set("global_community_impacts", globalImpacts);

    return objectMapper.writeValueAsString(context);
  }

  private String cleanJsonResponse(final String response) {
    if (response == null) {
      return "{}";
    }
    String cleaned = response.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length() - 3);
    }
    return cleaned.trim();
  }
}
