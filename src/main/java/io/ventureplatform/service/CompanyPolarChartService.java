package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for preparing percentile-based polar-area chart metrics.
 * Keeps the logic isolated so the controller stays thin and frontend
 * can consume a clean DTO. Uses caching to optimize performance.
 * Cache is pre-warmed on application startup for instant access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyPolarChartService {

  /** Epsilon for floating point comparison. */
  private static final double EPSILON = 1e-9;

  /** Percentile threshold for capping outliers. */
  private static final double CAP_PERCENTILE = 0.95;

  /** Cache time-to-live duration (12 hours). */
  private static final Duration CACHE_TTL = Duration.ofHours(12);

  /** Repository for company extraction data. */
  private final CompanyExtractionDataRepository companyRepository;

  /** Metrics excluded from portfolio ranking calculations. */
  private static final Set<String> RANKING_EXCLUDED_METRICS = Set.of(
      "growth_media_reach_score",
      "growth_sentiment_score",
      "growth_innovation_visibility_score",
      "growth_team_strength_score",
      "growth_funding_velocity_score",
      "growth_company_age_score"
  );

  /** Metric ID for growth likelihood composite score. */
  private static final String GROWTH_LIKELIHOOD_METRIC =
      "growth_composite_score";

  /** Metric ID for SBMO score. */
  private static final String SBMO_METRIC = "sbmo_weighted_score";

  /** Metric ID for five-year impact magnitude. */
  private static final String IMPACT_MAGNITUDE_METRIC = "impact_magnitude";

  /** Metric IDs used to compute size percentile. */
  private static final List<String> SIZE_METRIC_IDS = List.of(
      "size_employees",
      "size_website_traffic",
      "size_annual_sales",
      "company_age"
  );

  /** Cached metrics for all companies. */
  private volatile CompanyMetricsCache metricsCache;

  /** Timestamp of last cache update. */
  private volatile Instant lastCacheUpdate;

  /**
   * Pre-warm cache on application startup.
   * Runs asynchronously to not block application startup.
   */
  @PostConstruct
  public void initializeCache() {
    log.info("Initializing polar chart metrics cache on startup");
    try {
      refreshCache();
      log.info("Polar chart cache initialized successfully");
    } catch (Exception e) {
      log.error("Failed to initialize polar chart cache: {}",
          e.getMessage(), e);
      // Don't fail startup - cache will be built on first request
    }
  }

  /**
   * Metric definitions for polar area chart.
   * Each metric specifies extraction logic and percentile behavior.
   */
  private static final List<PolarMetricDefinition> METRIC_DEFINITIONS =
      Arrays.asList(
      new PolarMetricDefinition(
          "innovation_patents",
          "Innovation",
          "Number of patents",
          "count",
          true,
          true,
          data -> toDoubleNumber(data.getTotalPatents())
      ),
      new PolarMetricDefinition(
          "size_employees",
          "Size",
          "Number of employees",
          "count",
          true,
          true,
          data -> parseEmployeeCount(data.getNumberOfEmployees())
      ),
      new PolarMetricDefinition(
          "size_social_followers",
          "Size",
          "Social media followers",
          "count",
          true,
          true,
          CompanyPolarChartService::sumSocialFollowers
      ),
      new PolarMetricDefinition(
          "size_website_traffic",
          "Size",
          "Latest monthly website traffic",
          "count",
          true,
          true,
          CompanyPolarChartService::getLatestMonthlyTraffic
      ),
      new PolarMetricDefinition(
          "size_annual_sales",
          "Size",
          "Annual sales",
          "currency",
          true,
          true,
          CompanyPolarChartService::getLatestAnnualSales
      ),
      new PolarMetricDefinition(
          "funding_total",
          "Business & Growth",
          "Total funding",
          "currency",
          true,
          true,
          data -> toDoubleNumber(data.getTotalFundingAmount())
      ),
      new PolarMetricDefinition(
          "company_age",
          "Business & Growth",
          "Company age",
          "years",
          true,
          false,
          CompanyPolarChartService::calculateCompanyAge
      ),
      new PolarMetricDefinition(
          "impact_overall",
          "5-year Impact Potential",
          "Overall impact potential score",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getOverallImpactPotentialScore())
      ),
      new PolarMetricDefinition(
          "impact_magnitude",
          "5-year Impact Potential",
          "5-year impact magnitude",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getImpactMagnitude5Year())
      ),
      new PolarMetricDefinition(
          "impact_likelihood",
          "5-year Impact Potential",
          "5-year impact likelihood",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getImpactLikelihood())
      ),
      new PolarMetricDefinition(
          "sbmo_weighted_score",
          "Sustainable Business Model Orientation",
          "Sustainable business model orientation",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getSbmoTotalScore())
      ),
      new PolarMetricDefinition(
          "growth_media_reach_score",
          "Growth Likelihood",
          "Media reach",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthMediaReachScore())
      ),
      new PolarMetricDefinition(
          "growth_sentiment_score",
          "Growth Likelihood",
          "Sentiment",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthSentimentScore())
      ),
      new PolarMetricDefinition(
          "growth_innovation_visibility_score",
          "Growth Likelihood",
          "Innovation visibility",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthInnovationVisibilityScore())
      ),
      new PolarMetricDefinition(
          "growth_team_strength_score",
          "Growth Likelihood",
          "Team strength",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthTeamStrengthScore())
      ),
      new PolarMetricDefinition(
          "growth_funding_velocity_score",
          "Growth Likelihood",
          "Funding velocity",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthFundingVelocityScore())
      ),
      new PolarMetricDefinition(
          "growth_company_age_score",
          "Growth Likelihood",
          "Company age",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthCompanyAgeScore())
      ),
      new PolarMetricDefinition(
          "growth_composite_score",
          "Growth Likelihood",
          "Growth likelihood",
          "score",
          true,
          false,
          data -> toDoubleNumber(data.getGrowthCompositeScore())
      ),
      new PolarMetricDefinition(
          "esg_risk_total_inherent",
          "ESG risk",
          "Total inherent risk score",
          "riskScore",
          false,
          false,
          data -> toDoubleNumber(data.getEsgRiskTotalInherent())
      ),
      new PolarMetricDefinition(
          "esg_risk_total_adjusted",
          "ESG risk",
          "Total adjusted risk score",
          "riskScore",
          false,
          false,
          data -> toDoubleNumber(data.getEsgRiskTotalAdjusted())
      ),
      new PolarMetricDefinition(
          "esg_risk_total_foresight",
          "ESG risk",
          "Total foresight risk score",
          "riskScore",
          false,
          false,
          data -> toDoubleNumber(data.getEsgRiskTotalForesight())
      ),
      new PolarMetricDefinition(
          "emissions_total",
          "Emissions",
          "Total annual emissions",
          "tonnesCO2e",
          false,
          true,
          data -> parseDecimalString(data.getTotalCarbonEmissions())
      ),
      new PolarMetricDefinition(
          "emissions_scope1",
          "Emissions",
          "Scope 1 emissions",
          "tonnesCO2e",
          false,
          true,
          data -> parseDecimalString(data.getScope1Emissions())
      ),
      new PolarMetricDefinition(
          "emissions_scope2",
          "Emissions",
          "Scope 2 emissions",
          "tonnesCO2e",
          false,
          true,
          data -> parseDecimalString(data.getScope2Emissions())
      ),
      new PolarMetricDefinition(
          "emissions_scope3",
          "Emissions",
          "Scope 3 emissions",
          "tonnesCO2e",
          false,
          true,
          data -> parseDecimalString(data.getScope3Emissions())
      )
  );

  /**
   * Generate polar-area chart metrics for a given company.
   *
   * @param companyId ID of the company to analyze
   * @return polar chart response with percentile data
   */
  public PolarChartResponse getPolarChart(final Long companyId) {
    CompanyExtractionData company = companyRepository
        .findById(companyId)
        .orElseThrow(() -> new IllegalArgumentException(
            "Company not found with ID: " + companyId));

    CompanyMetricsCache cache = getOrRefreshCache();

    Map<String, Double> companyValues = new HashMap<>();
    for (PolarMetricDefinition definition : METRIC_DEFINITIONS) {
      // Skip foresight metric if company doesn't qualify for it
      if ("esg_risk_total_foresight".equals(definition.id)
          && !Boolean.TRUE.equals(company.getEsgForesightQualified())) {
        continue;
      }
      Double value = definition.extract(company);
      if (value != null && !Double.isNaN(value)
          && !Double.isInfinite(value)) {
        companyValues.put(definition.id, value);
      }
    }

    List<PolarMetric> metricResults = new ArrayList<>();
    boolean hasCappedMetrics = false;

    for (PolarMetricDefinition definition : METRIC_DEFINITIONS) {
      // Skip foresight metric if company doesn't qualify for it
      if ("esg_risk_total_foresight".equals(definition.id)
          && !Boolean.TRUE.equals(company.getEsgForesightQualified())) {
        continue;
      }
      Double rawValue = companyValues.get(definition.id);
      List<Double> cappedValues = cache.cappedValueMap
          .getOrDefault(definition.id, List.of());

      if (rawValue == null || cappedValues.isEmpty()) {
        metricResults.add(PolarMetric.missing(definition));
        continue;
      }

      double capThreshold = cache.capThresholds
          .getOrDefault(definition.id, Double.POSITIVE_INFINITY);
      double cappedValue = definition.applyCapping
          ? Math.min(rawValue, capThreshold)
          : rawValue;
      boolean wasCapped = definition.applyCapping
          && rawValue - capThreshold > EPSILON;

      if (wasCapped) {
        hasCappedMetrics = true;
      }

      double percentile = calculatePercentile(
          cappedValues,
          cappedValue,
          definition.higherIsBetter);
      long sampleSize = cache.validCounts
          .getOrDefault(definition.id, 0L);

      metricResults.add(PolarMetric.from(
          definition,
          rawValue,
          cappedValue,
          percentile,
          sampleSize,
          wasCapped,
          capThreshold));
    }

    PolarChartResponse response = new PolarChartResponse();
    response.setCompanyId(companyId);
    response.setCompanyName(company.getCompanyName());
    response.setSampleSize(cache.sampleSize);
    response.setMetrics(metricResults);
    response.setHasCappedMetrics(hasCappedMetrics);
    response.setCachedAt(cache.calculatedAt);
    response.setRankedCompanyCount(cache.rankedCompanyCount);

    CompanyPortfolioRanking ranking =
        cache.portfolioRankings.get(companyId);
    if (ranking != null) {
      response.setVenturePlatformScore(
          ranking.getAveragePercentile());
      response.setMetricsConsidered(ranking.getMetricCount());
      response.setPortfolioRank(ranking.getRank());
    }

    return response;
  }

  /**
   * Get cached ranking snapshot for a single company.
   *
   * @param companyId company identifier
   * @return snapshot containing ranking data or null if not ranked
   */
  public PortfolioRankSnapshot getPortfolioRankingSnapshot(
      final Long companyId) {
    if (companyId == null) {
      return null;
    }
    CompanyMetricsCache cache = getOrRefreshCache();
    CompanyPortfolioRanking ranking =
        cache.getPortfolioRankings().get(companyId);
    CompanyPortfolioRanking rankingV2 = null;
    if (cache.getPortfolioRankingsV2() != null) {
      rankingV2 = cache.getPortfolioRankingsV2().get(companyId);
    }
    if (ranking == null) {
      return null;
    }
    return new PortfolioRankSnapshot(
        ranking.getCompanyId(),
        ranking.getAveragePercentile(),
        ranking.getMetricCount(),
        ranking.getRank(),
        cache.getRankedCompanyCount(),
        rankingV2 != null ? rankingV2.getAveragePercentile() : null,
        rankingV2 != null ? rankingV2.getMetricCount() : null,
        rankingV2 != null ? rankingV2.getRank() : null,
        rankingV2 != null ? cache.getRankedCompanyCountV2() : null);
  }

  /**
   * Get cached ranking snapshots for multiple companies.
   *
   * @param companyIds company identifiers
   * @return map of ranking snapshots keyed by company ID
   */
  public Map<Long, PortfolioRankSnapshot> getPortfolioRankingSnapshots(
      final Collection<Long> companyIds) {
    CompanyMetricsCache cache = getOrRefreshCache();
    Map<Long, PortfolioRankSnapshot> snapshots = new HashMap<>();
    if (companyIds == null || companyIds.isEmpty()) {
      return snapshots;
    }
    for (Long companyId : companyIds) {
      if (companyId == null) {
        continue;
      }
      CompanyPortfolioRanking ranking =
          cache.getPortfolioRankings().get(companyId);
      CompanyPortfolioRanking rankingV2 = null;
      if (cache.getPortfolioRankingsV2() != null) {
        rankingV2 = cache.getPortfolioRankingsV2().get(companyId);
      }
      if (ranking != null) {
        snapshots.put(companyId,
            new PortfolioRankSnapshot(
                ranking.getCompanyId(),
                ranking.getAveragePercentile(),
                ranking.getMetricCount(),
                ranking.getRank(),
                cache.getRankedCompanyCount(),
                rankingV2 != null
                    ? rankingV2.getAveragePercentile()
                    : null,
                rankingV2 != null ? rankingV2.getMetricCount() : null,
                rankingV2 != null ? rankingV2.getRank() : null,
                rankingV2 != null
                    ? cache.getRankedCompanyCountV2()
                    : null));
      }
    }
    return snapshots;
  }

  /**
   * Get total number of companies that currently have a ranking.
   *
   * @return total ranked company count
   */
  public int getRankedCompanyCount() {
    return getOrRefreshCache().getRankedCompanyCount();
  }

  /**
   * Get total number of companies that currently have a V2 ranking.
   *
   * @return total ranked company count for V2
   */
  public int getRankedCompanyCountV2() {
    return getOrRefreshCache().getRankedCompanyCountV2();
  }

  /**
   * Get cached metrics or refresh if stale.
   *
   * @return current metrics cache
   */
  private synchronized CompanyMetricsCache getOrRefreshCache() {
    Instant now = Instant.now();

    if (metricsCache == null
        || lastCacheUpdate == null
        || Duration.between(lastCacheUpdate, now)
            .compareTo(CACHE_TTL) > 0) {
      log.info("Refreshing company metrics cache");
      metricsCache = calculateMetricsForAllCompanies();
      lastCacheUpdate = now;
      log.info("Cache refreshed at {}, expires at {}",
          lastCacheUpdate, lastCacheUpdate.plus(CACHE_TTL));
    }

    return metricsCache;
  }

  /**
   * Calculate metrics for all companies (expensive operation).
   *
   * @return cache containing metric distributions
  */
  private CompanyMetricsCache calculateMetricsForAllCompanies() {
    List<CompanyExtractionData> allCompanies =
        companyRepository.findAll();

    Map<String, List<Double>> metricValueMap = new HashMap<>();
    Map<String, List<Double>> cappedValueMap = new HashMap<>();
    Map<String, Double> capThresholds = new HashMap<>();
    Map<String, Long> validCounts = new HashMap<>();
    Map<Long, Map<String, Double>> companyMetricValues =
        new HashMap<>();
    Map<String, PolarMetricDefinition> definitionMap =
        METRIC_DEFINITIONS.stream()
            .collect(Collectors.toMap(
                PolarMetricDefinition::getId,
                definition -> definition));

    for (CompanyExtractionData company : allCompanies) {
      Map<String, Double> companyMetrics = new HashMap<>();
      for (PolarMetricDefinition definition : METRIC_DEFINITIONS) {
        Double value = definition.extract(company);
        if (value != null && !Double.isNaN(value)
            && !Double.isInfinite(value)) {
          metricValueMap.computeIfAbsent(definition.id,
              k -> new ArrayList<>()).add(value);
          companyMetrics.put(definition.id, value);
        }
      }
      if (!companyMetrics.isEmpty()) {
        companyMetricValues.put(company.getId(), companyMetrics);
      }
    }

    for (PolarMetricDefinition definition : METRIC_DEFINITIONS) {
      List<Double> values = metricValueMap
          .getOrDefault(definition.id, List.of());
      if (values.isEmpty()) {
        continue;
      }

      List<Double> cappedValues = new ArrayList<>(values.size());
      double capThreshold = definition.applyCapping
          ? calculatePercentileThreshold(values, CAP_PERCENTILE)
          : Double.POSITIVE_INFINITY;

      for (Double value : values) {
        cappedValues.add(Math.min(value, capThreshold));
      }

      cappedValueMap.put(definition.id, cappedValues);
      if (definition.applyCapping
          && !Double.isInfinite(capThreshold)) {
        capThresholds.put(definition.id, capThreshold);
      }
      validCounts.put(definition.id, (long) values.size());
    }

    List<CompanyPortfolioRanking> rankingEntries = new ArrayList<>();
    List<CompanyPortfolioRanking> rankingEntriesV2 = new ArrayList<>();
    for (CompanyExtractionData company : allCompanies) {
      Map<String, Double> metrics =
          companyMetricValues.get(company.getId());
      if (metrics == null || metrics.isEmpty()) {
        continue;
      }

      double totalPercentile = 0.0;
      int metricCount = 0;

      for (PolarMetricDefinition definition : METRIC_DEFINITIONS) {
        Double rawValue = metrics.get(definition.id);
        if (rawValue == null) {
          continue;
        }
        if (RANKING_EXCLUDED_METRICS.contains(definition.id)) {
          continue;
        }
        List<Double> distribution = cappedValueMap
            .getOrDefault(definition.id, List.of());
        if (distribution.isEmpty()) {
          continue;
        }
        double capThreshold = capThresholds
            .getOrDefault(definition.id, Double.POSITIVE_INFINITY);
        double cappedValue = definition.applyCapping
            ? Math.min(rawValue, capThreshold)
            : rawValue;
        double percentile = calculatePercentile(
            distribution,
            cappedValue,
            definition.higherIsBetter);
        totalPercentile += percentile;
        metricCount++;
      }

      if (metricCount > 0) {
        double averagePercentile = totalPercentile / metricCount;
        rankingEntries.add(new CompanyPortfolioRanking(
            company.getId(),
            averagePercentile,
            metricCount,
            0
        ));
      }

      Double growthPercentile =
          calculateMetricPercentile(
              cappedValueMap,
              capThresholds,
              definitionMap,
              GROWTH_LIKELIHOOD_METRIC,
              metrics.get(GROWTH_LIKELIHOOD_METRIC));
      Double sbmoPercentile =
          calculateMetricPercentile(
              cappedValueMap,
              capThresholds,
              definitionMap,
              SBMO_METRIC,
              metrics.get(SBMO_METRIC));
      Double impactMagnitudePercentile =
          calculateMetricPercentile(
              cappedValueMap,
              capThresholds,
              definitionMap,
              IMPACT_MAGNITUDE_METRIC,
              metrics.get(IMPACT_MAGNITUDE_METRIC));

      double sizeTotalPercentile = 0.0;
      int sizeMetricCount = 0;
      for (String sizeMetricId : SIZE_METRIC_IDS) {
        Double sizePercentile =
            calculateMetricPercentile(
                cappedValueMap,
                capThresholds,
                definitionMap,
                sizeMetricId,
                metrics.get(sizeMetricId));
        if (sizePercentile != null) {
          sizeTotalPercentile += sizePercentile;
          sizeMetricCount++;
        }
      }
      Double sizePercentile = sizeMetricCount > 0
          ? sizeTotalPercentile / sizeMetricCount
          : null;

      double v2TotalPercentile = 0.0;
      int v2MetricCount = 0;

      if (growthPercentile != null) {
        v2TotalPercentile += growthPercentile;
        v2MetricCount++;
      }
      if (sbmoPercentile != null) {
        v2TotalPercentile += sbmoPercentile;
        v2MetricCount++;
      }
      if (impactMagnitudePercentile != null) {
        v2TotalPercentile += impactMagnitudePercentile;
        v2MetricCount++;
      }
      if (sizePercentile != null) {
        v2TotalPercentile += sizePercentile;
        v2MetricCount++;
      }

      if (v2MetricCount > 0) {
        double v2AveragePercentile =
            v2TotalPercentile / v2MetricCount;
        rankingEntriesV2.add(new CompanyPortfolioRanking(
            company.getId(),
            v2AveragePercentile,
            v2MetricCount,
            0
        ));
      }
    }

    rankingEntries.sort(
        Comparator
            .comparing(CompanyPortfolioRanking::getAveragePercentile)
            .reversed()
            .thenComparing(CompanyPortfolioRanking::getCompanyId));

    double lastScore = Double.NaN;
    int currentRank = 0;
    int processed = 0;
    Map<Long, CompanyPortfolioRanking> portfolioRankings =
        new HashMap<>();

    for (CompanyPortfolioRanking entry : rankingEntries) {
      processed++;
      if (processed == 1
          || Math.abs(entry.getAveragePercentile() - lastScore)
              > EPSILON) {
        currentRank = processed;
        lastScore = entry.getAveragePercentile();
      }
      entry.setRank(currentRank);
      portfolioRankings.put(entry.getCompanyId(), entry);
    }

    rankingEntriesV2.sort(
        Comparator
            .comparing(CompanyPortfolioRanking::getAveragePercentile)
            .reversed()
            .thenComparing(CompanyPortfolioRanking::getCompanyId));

    double lastScoreV2 = Double.NaN;
    int currentRankV2 = 0;
    int processedV2 = 0;
    Map<Long, CompanyPortfolioRanking> portfolioRankingsV2 =
        new HashMap<>();

    for (CompanyPortfolioRanking entry : rankingEntriesV2) {
      processedV2++;
      if (processedV2 == 1
          || Math.abs(entry.getAveragePercentile() - lastScoreV2)
              > EPSILON) {
        currentRankV2 = processedV2;
        lastScoreV2 = entry.getAveragePercentile();
      }
      entry.setRank(currentRankV2);
      portfolioRankingsV2.put(entry.getCompanyId(), entry);
    }

    return new CompanyMetricsCache(
        metricValueMap,
        cappedValueMap,
        capThresholds,
        validCounts,
        allCompanies.size(),
        Instant.now(),
        portfolioRankings,
        rankingEntries.size(),
        portfolioRankingsV2,
        rankingEntriesV2.size()
    );
  }

  /**
   * Calculate percentile for a specific metric using cached distributions.
   *
   * @param cappedValueMap capped values per metric
   * @param capThresholds capping thresholds per metric
   * @param definitionMap metric definitions keyed by ID
   * @param metricId metric identifier
   * @param rawValue raw metric value
   * @return percentile or null when unavailable
   */
  private Double calculateMetricPercentile(
      final Map<String, List<Double>> cappedValueMap,
      final Map<String, Double> capThresholds,
      final Map<String, PolarMetricDefinition> definitionMap,
      final String metricId,
      final Double rawValue) {
    if (rawValue == null) {
      return null;
    }
    PolarMetricDefinition definition = definitionMap.get(metricId);
    if (definition == null) {
      return null;
    }
    List<Double> distribution =
        cappedValueMap.getOrDefault(metricId, List.of());
    if (distribution.isEmpty()) {
      return null;
    }
    double capThreshold = definition.isApplyCapping()
        ? capThresholds.getOrDefault(
            metricId,
            Double.POSITIVE_INFINITY)
        : Double.POSITIVE_INFINITY;
    double cappedValue = definition.isApplyCapping()
        ? Math.min(rawValue, capThreshold)
        : rawValue;
    return calculatePercentile(
        distribution,
        cappedValue,
        definition.isHigherIsBetter());
  }

  /**
   * Manually refresh cache.
   * Can be called from scheduled job or admin endpoint.
   */
  public void refreshCache() {
    log.info("Manual cache refresh triggered");
    synchronized (this) {
      metricsCache = calculateMetricsForAllCompanies();
      lastCacheUpdate = Instant.now();
    }
    log.info("Manual cache refresh completed at {}", lastCacheUpdate);
  }

  /**
   * Convert Number to Double.
   *
   * @param value number value
   * @return double value or null
   */
  private static Double toDoubleNumber(final Number value) {
    if (value == null) {
      return null;
    }
    return value.doubleValue();
  }

  /**
   * Parse emissions string to double.
   *
   * @param input emissions string
   * @return parsed value or null
   */
  private static Double parseDecimalString(final String input) {
    if (input == null || input.trim().isEmpty()) {
      return null;
    }
    String cleaned = input.trim()
        .toLowerCase(Locale.ENGLISH)
        .replace("ton", "")
        .replace("tco2", "")
        .replace("t co2", "")
        .replace("tco2e", "")
        .replace("co2e", "")
        .replace(",", " ");
    cleaned = cleaned.replaceAll("[^0-9.\\- ]", " ").trim();
    cleaned = cleaned.replaceAll("\\s+", "");
    if (cleaned.isEmpty()) {
      return null;
    }
    try {
      return Double.parseDouble(cleaned);
    } catch (NumberFormatException e) {
      log.debug("Unable to parse decimal value from '{}'", input);
      return null;
    }
  }

  /**
   * Get latest annual sales from available years.
   *
   * @param data company data
   * @return latest sales value or null
   */
  private static Double getLatestAnnualSales(
      final CompanyExtractionData data) {
    if (data.getAnnualSales2024() != null) {
      return data.getAnnualSales2024().doubleValue();
    }
    if (data.getAnnualSales2023() != null) {
      return data.getAnnualSales2023().doubleValue();
    }
    if (data.getAnnualSales2022() != null) {
      return data.getAnnualSales2022().doubleValue();
    }
    return null;
  }

  /**
   * Get latest monthly traffic from time series.
   *
   * @param data company data
   * @return latest traffic value or null
   */
  private static Double getLatestMonthlyTraffic(
      final CompanyExtractionData data) {
    List<Long> trafficSeries = Arrays.asList(
        data.getTrafficDec2025(),
        data.getTrafficNov2025(),
        data.getTrafficOct2025(),
        data.getTrafficSep2025(),
        data.getTrafficAug2025(),
        data.getTrafficJul2025(),
        data.getTrafficJun2025(),
        data.getTrafficMay2025(),
        data.getTrafficApr2025(),
        data.getTrafficMar2025(),
        data.getTrafficFeb2025(),
        data.getTrafficJan2025(),
        data.getTrafficDec2024(),
        data.getTrafficNov2024(),
        data.getTrafficOct2024(),
        data.getTrafficSep2024(),
        data.getTrafficAug2024(),
        data.getTrafficJul2024(),
        data.getTrafficJun2024(),
        data.getTrafficMay2024(),
        data.getTrafficApr2024(),
        data.getTrafficMar2024(),
        data.getTrafficFeb2024(),
        data.getTrafficJan2024(),
        data.getTrafficDec2023(),
        data.getTrafficNov2023(),
        data.getTrafficOct2023(),
        data.getTrafficSep2023(),
        data.getTrafficAug2023()
    );
    for (Long value : trafficSeries) {
      if (value != null && value > 0) {
        return value.doubleValue();
      }
    }
    return null;
  }

  /**
   * Sum all social media followers.
   *
   * @param data company data
   * @return total followers or null
   */
  private static Double sumSocialFollowers(
      final CompanyExtractionData data) {
    if (data.getSocialMediaFollowerCounts() == null) {
      return null;
    }
    DoubleSummaryStatistics stats = data
        .getSocialMediaFollowerCounts()
        .values()
        .stream()
        .filter(Objects::nonNull)
        .mapToDouble(Long::doubleValue)
        .summaryStatistics();
    if (stats.getCount() == 0) {
      return null;
    }
    return stats.getSum();
  }

  /**
   * Parse employee count from string.
   *
   * @param input employee count string
   * @return parsed count or null
   */
  private static Double parseEmployeeCount(final String input) {
    if (input == null || input.trim().isEmpty()
        || "N/A".equalsIgnoreCase(input.trim())) {
      return null;
    }
    String cleaned = input.trim();
    try {
      if (cleaned.contains("-")) {
        String[] parts = cleaned.split("-");
        if (parts.length >= 2) {
          long lower = Long.parseLong(
              parts[0].replaceAll("[^0-9]", ""));
          long upper = Long.parseLong(
              parts[1].replaceAll("[^0-9]", ""));
          return (lower + upper) / 2.0;
        }
      }
      if (cleaned.contains("+")) {
        String numeric = cleaned.replace("+", "")
            .replaceAll("[^0-9]", "");
        if (!numeric.isEmpty()) {
          return Double.parseDouble(numeric);
        }
      }
      String numeric = cleaned.replaceAll("[^0-9]", "");
      if (!numeric.isEmpty()) {
        return Double.parseDouble(numeric);
      }
    } catch (NumberFormatException e) {
      log.debug("Unable to parse employee count from '{}'", input);
      return null;
    }
    return null;
  }

  /**
   * Calculate company age from founding year.
   *
   * @param data company extraction data
   * @return company age in years or null if not available
   */
  private static Double calculateCompanyAge(final CompanyExtractionData data) {
    // Use legal_entity_formation_date to calculate company age
    String yearStr = data.getLegalEntityFormationDate();

    if (yearStr == null || yearStr.isEmpty()) {
      return null;
    }

    try {
      // Handle various formats like "2015", "2015.0", etc.
      String cleanYear = yearStr.replaceAll("[^0-9]", "");
      if (cleanYear.length() >= 4) {
        // Take first 4 digits as year
        int year = Integer.parseInt(cleanYear.substring(0, 4));
        // Get current year
        int currentYear = java.time.Year.now().getValue();
        // Calculate age
        double age = currentYear - year;
        // Return null for invalid ages (negative or too old)
        if (age < 0 || age > 200) {
          log.debug("Invalid company age calculated: {} for year: {}",
              age, yearStr);
          return null;
        }
        return age;
      }
    } catch (NumberFormatException e) {
      log.debug("Unable to parse year from: '{}'", yearStr);
    }
    return null;
  }

  /**
   * Calculate percentile threshold from values.
   *
   * @param values list of values
   * @param percentile target percentile (0.0 to 1.0)
   * @return threshold value
   */
  private static double calculatePercentileThreshold(
      final List<Double> values,
      final double percentile) {
    if (values.isEmpty()) {
      return Double.POSITIVE_INFINITY;
    }
    List<Double> sorted = values.stream()
        .sorted()
        .collect(Collectors.toList());
    int index = (int) Math.ceil(percentile * sorted.size()) - 1;
    index = Math.max(0, Math.min(index, sorted.size() - 1));
    return sorted.get(index);
  }

  /**
   * Calculate percentile rank for a value.
   *
   * @param values list of all values
   * @param currentValue value to rank
   * @param higherIsBetter whether higher values are better
   * @return percentile rank (0.0 to 1.0)
   */
  private static double calculatePercentile(
      final List<Double> values,
      final double currentValue,
      final boolean higherIsBetter) {
    if (values.isEmpty()) {
      return 0.0;
    }

    if (higherIsBetter && Math.abs(currentValue) < EPSILON) {
      return 0.0;
    }

    List<Double> sorted = values.stream()
        .sorted()
        .collect(Collectors.toList());
    int total = sorted.size();

    if (higherIsBetter) {
      long rank = sorted.stream()
          .filter(value -> value <= currentValue + EPSILON)
          .count();
      return clamp((double) rank / total);
    } else {
      long rank = sorted.stream()
          .filter(value -> value + EPSILON >= currentValue)
          .count();
      return clamp((double) rank / total);
    }
  }

  /**
   * Clamp value between 0 and 1.
   *
   * @param value input value
   * @return clamped value
   */
  private static double clamp(final double value) {
    if (value < 0.0) {
      return 0.0;
    }
    if (value > 1.0) {
      return 1.0;
    }
    return value;
  }

  /**
   * Format value for display.
   *
   * @param value numeric value
   * @param unit unit type
   * @return formatted string
   */
  private static String formatValue(final Double value,
                                     final String unit) {
    if (value == null) {
      return null;
    }
    NumberFormat formatter = NumberFormat
        .getNumberInstance(Locale.US);
    formatter.setMaximumFractionDigits(
        "score".equals(unit) || "riskScore".equals(unit) ? 2 : 0);
    String formatted = formatter.format(value);
    if ("currency".equals(unit)) {
      return "$" + formatted;
    }
    if ("tonnesCO2e".equals(unit)) {
      return formatted + " tCO₂e";
    }
    if ("riskScore".equals(unit)) {
      return formatted;
    }
    return formatted;
  }

  /**
   * Cache container for metric distributions.
   */
  @Data
  @AllArgsConstructor
  private static class CompanyMetricsCache {
    /** Raw metric values by metric ID. */
    private Map<String, List<Double>> metricValueMap;

    /** Capped metric values by metric ID. */
    private Map<String, List<Double>> cappedValueMap;

    /** Capping thresholds by metric ID. */
    private Map<String, Double> capThresholds;

    /** Valid value counts by metric ID. */
    private Map<String, Long> validCounts;

    /** Total sample size. */
    private int sampleSize;

    /** Timestamp when cache was calculated. */
    private Instant calculatedAt;

    /** Portfolio ranking details keyed by company ID. */
    private Map<Long, CompanyPortfolioRanking> portfolioRankings;

    /** Number of companies that received a ranking. */
    private int rankedCompanyCount;

    /** Portfolio ranking V2 keyed by company ID. */
    private Map<Long, CompanyPortfolioRanking> portfolioRankingsV2;

    /** Number of companies that received a V2 ranking. */
    private int rankedCompanyCountV2;
  }

  /**
   * Portfolio ranking aggregate for a company.
   */
  @Data
  @AllArgsConstructor
  private static class CompanyPortfolioRanking {
    /** Company identifier. */
    private Long companyId;

    /** Average percentile across available metrics. */
    private double averagePercentile;

    /** Number of metrics included in the average. */
    private int metricCount;

    /** Rank within the portfolio (1 = best). */
    private int rank;
  }

  /**
   * Lightweight snapshot of portfolio ranking data.
   */
  @Data
  @AllArgsConstructor
  public static class PortfolioRankSnapshot {
    /** Company identifier. */
    private Long companyId;

    /** Average percentile across available metrics. */
    private double averagePercentile;

    /** Number of metrics considered in the average. */
    private int metricsConsidered;

    /** Rank within the portfolio (1 = best). */
    private int rank;

    /** Total number of companies that received a ranking. */
    private int rankedCompanyCount;

    /** Average percentile using V2 weighting. */
    private Double averagePercentileV2;

    /** Number of metrics considered for V2 ranking. */
    private Integer metricsConsideredV2;

    /** Rank within portfolio using V2 weighting. */
    private Integer rankV2;

    /** Companies with a valid V2 ranking. */
    private Integer rankedCompanyCountV2;
  }

  /**
   * Defines a metric for the polar area chart.
   */
  @Data
  private static class PolarMetricDefinition {
    /** Unique identifier for this metric. */
    private String id;

    /** Category this metric belongs to. */
    private String category;

    /** Display label for this metric. */
    private String label;

    /** Unit of measurement. */
    private String unit;

    /** Whether higher values are better. */
    private boolean higherIsBetter;

    /** Whether to apply 95th percentile capping. */
    private boolean applyCapping;

    /** Function to extract metric value from company data. */
    private MetricExtractor extractor;

    /**
     * Constructor for metric definition.
     *
     * @param metricId metric identifier
     * @param metricCategory metric category
     * @param metricLabel display label
     * @param metricUnit measurement unit
     * @param isHigherBetter whether higher is better
     * @param shouldApplyCapping whether to apply capping
     * @param metricExtractor value extraction function
     */
    PolarMetricDefinition(final String metricId,
                          final String metricCategory,
                          final String metricLabel,
                          final String metricUnit,
                          final boolean isHigherBetter,
                          final boolean shouldApplyCapping,
                          final MetricExtractor metricExtractor) {
      this.id = metricId;
      this.category = metricCategory;
      this.label = metricLabel;
      this.unit = metricUnit;
      this.higherIsBetter = isHigherBetter;
      this.applyCapping = shouldApplyCapping;
      this.extractor = metricExtractor;
    }

    /**
     * Extract metric value from company.
     *
     * @param data company data
     * @return extracted value
     */
    Double extract(final CompanyExtractionData data) {
      return extractor.extract(data);
    }
  }

  /**
   * Get list of available metrics for custom rankings.
   *
   * @return list of metric definitions for frontend use
   */
  public List<Map<String, Object>> getAvailableMetrics() {
    return METRIC_DEFINITIONS.stream()
        .map(definition -> {
          Map<String, Object> metric = new HashMap<>();
          metric.put("id", definition.getId());
          metric.put("category", definition.getCategory());
          metric.put("label", definition.getLabel());
          metric.put("unit", definition.getUnit());
          metric.put("higherIsBetter", definition.isHigherIsBetter());
          return metric;
        })
        .collect(Collectors.toList());
  }

  /**
   * Calculate custom ranking score for a company based on selected metrics.
   *
   * @param companyId company identifier
   * @param metricIds list of metric IDs to include in ranking
   * @return average percentile across selected metrics, or null if no valid metrics
   */
  public Double calculateCustomRankingScore(
      final Long companyId,
      final List<String> metricIds) {
    if (companyId == null || metricIds == null || metricIds.isEmpty()) {
      return null;
    }

    CompanyExtractionData company = companyRepository
        .findById(companyId)
        .orElse(null);
    if (company == null) {
      return null;
    }

    CompanyMetricsCache cache = getOrRefreshCache();
    Map<String, PolarMetricDefinition> definitionMap =
        METRIC_DEFINITIONS.stream()
            .collect(Collectors.toMap(
                PolarMetricDefinition::getId,
                definition -> definition));

    double totalPercentile = 0.0;
    int metricCount = 0;

    for (String metricId : metricIds) {
      PolarMetricDefinition definition = definitionMap.get(metricId);
      if (definition == null) {
        continue;
      }

      Double rawValue = definition.extract(company);
      if (rawValue == null || Double.isNaN(rawValue) || Double.isInfinite(rawValue)) {
        continue;
      }

      List<Double> distribution = cache.getCappedValueMap()
          .getOrDefault(metricId, List.of());
      if (distribution.isEmpty()) {
        continue;
      }

      double capThreshold = definition.isApplyCapping()
          ? cache.getCapThresholds().getOrDefault(metricId, Double.POSITIVE_INFINITY)
          : Double.POSITIVE_INFINITY;
      double cappedValue = definition.isApplyCapping()
          ? Math.min(rawValue, capThreshold)
          : rawValue;

      double percentile = calculatePercentile(
          distribution,
          cappedValue,
          definition.isHigherIsBetter());

      totalPercentile += percentile;
      metricCount++;
    }

    return metricCount > 0 ? totalPercentile / metricCount : null;
  }

  /**
   * Functional interface for extracting metrics.
   */
  @FunctionalInterface
  private interface MetricExtractor {
    /**
     * Extract value from company data.
     *
     * @param data company data
     * @return extracted value
     */
    Double extract(CompanyExtractionData data);
  }

  /**
   * Response containing polar area chart data.
   */
  @Data
  public static class PolarChartResponse {
    /** Company ID this chart is for. */
    private Long companyId;

    /** Company name. */
    private String companyName;

    /** Number of companies in comparison sample. */
    private int sampleSize;

    /** Whether any metrics were capped due to outliers. */
    private boolean hasCappedMetrics;

    /** List of metrics with percentile data. */
    private List<PolarMetric> metrics;

    /** Timestamp when data was cached. */
    private Instant cachedAt;

    /** Average percentile used for platform ranking. */
    private Double venturePlatformScore;

    /** Number of metrics included in the rank calculation. */
    private Integer metricsConsidered;

    /** Rank position among companies in the portfolio. */
    private Integer portfolioRank;

    /** Number of companies that have a valid ranking. */
    private Integer rankedCompanyCount;

    /** Narrative strengths text. */
    private String portfolioStrengthsText;

    /** Narrative weaknesses text. */
    private String portfolioWeaknessesText;

    /** Narrative impact text. */
    private String portfolioImpactText;

    /** Narrative potential needs text. */
    private String portfolioPotentialNeedsText;

    /** Timestamp when narrative was generated. */
    private Instant portfolioNarrativeGeneratedAt;
  }

  /**
   * Individual metric with percentile ranking.
   */
  @Data
  @AllArgsConstructor
  public static class PolarMetric {
    /** Metric identifier. */
    private String id;

    /** Category name. */
    private String category;

    /** Display label. */
    private String label;

    /** Unit of measurement. */
    private String unit;

    /** Raw value before capping. */
    private Double rawValue;

    /** Value after 95th percentile capping. */
    private Double cappedValue;

    /** Percentile rank (0.0 to 1.0). */
    private Double percentile;

    /** Number of companies in sample for this metric. */
    private long sampleSize;

    /** Whether this metric has no data. */
    private boolean missing;

    /** Whether raw value was capped. */
    private boolean capped;

    /** The cap threshold value. */
    private Double capValue;

    /** Formatted display value. */
    private String formattedValue;

    /**
     * Create missing metric.
     *
     * @param definition metric definition
     * @return polar metric with missing flag
     */
    static PolarMetric missing(final PolarMetricDefinition definition) {
      return new PolarMetric(
          definition.id,
          definition.category,
          definition.label,
          definition.unit,
          null,
          null,
          null,
          0L,
          true,
          false,
          null,
          null
      );
    }

    /**
     * Create metric from values.
     *
     * @param definition metric definition
     * @param rawValue raw value
     * @param cappedValue capped value
     * @param percentile percentile rank
     * @param sampleSize sample size
     * @param wasCapped whether value was capped
     * @param capValue cap threshold
     * @return polar metric
     */
    static PolarMetric from(final PolarMetricDefinition definition,
                            final Double rawValue,
                            final Double cappedValue,
                            final double percentile,
                            final long sampleSize,
                            final boolean wasCapped,
                            final double capValue) {
      return new PolarMetric(
          definition.id,
          definition.category,
          definition.label,
          definition.unit,
          rawValue,
          cappedValue,
          percentile,
          sampleSize,
          false,
          wasCapped,
          Double.isInfinite(capValue) ? null : capValue,
          formatValue(rawValue, definition.unit)
      );
    }
  }
}
