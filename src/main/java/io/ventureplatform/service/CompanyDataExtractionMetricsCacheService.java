package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyDataExtractionMetrics;
import io.ventureplatform.repository.CompanyDataExtractionMetricsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing cached metrics for company data extraction.
 * Provides fast access to pre-calculated portfolio totals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyDataExtractionMetricsCacheService {

  private final CompanyDataExtractionMetricsRepository metricsRepository;
  private final CompanyExtractionDataService companyExtractionDataService;

  // Cache keys - MUST match the keys used in CompanyExtractionDataService.calculatePortfolioTotals()
  public static final String TOTAL_COMPANIES = "totalCompanies";
  public static final String TOTAL_EMPLOYEES = "totalEmployees";
  public static final String TOTAL_PATENTS = "totalPatents";
  public static final String TOTAL_SOCIAL_MEDIA_FOLLOWERS = "totalSocialMediaFollowers";
  public static final String TOTAL_DAILY_TRAFFIC = "totalDailyTraffic";
  public static final String COMPANIES_WITH_REPORTS = "companiesWithReports";
  public static final String TOTAL_SALES = "totalSales";
  public static final String TOTAL_SALES_RAW = "totalSalesRaw";
  public static final String TOTAL_SALES_CURRENCY = "totalSalesCurrency";
  public static final String TOTAL_CARBON_EMISSIONS = "totalCarbonEmissions";
  public static final String TOTAL_SCOPE1_EMISSIONS = "totalScope1Emissions";
  public static final String TOTAL_SCOPE2_EMISSIONS = "totalScope2Emissions";
  public static final String TOTAL_SCOPE3_EMISSIONS = "totalScope3Emissions";
  public static final String COMPANIES_WITH_EMISSIONS = "companiesWithEmissions";

  /**
   * Get cached portfolio totals for all companies (global metrics).
   *
   * @return Map containing all portfolio metrics
   */
  @Transactional
  public Map<String, Object> getCachedPortfolioTotals() {
    return getCachedPortfolioTotals(null);
  }

  /**
   * Get cached portfolio totals for a specific portfolio or all companies.
   *
   * @param portfolioId the portfolio ID (null for global metrics)
   * @return Map containing all portfolio metrics
   */
  @Transactional
  public Map<String, Object> getCachedPortfolioTotals(Long portfolioId) {
    log.info("[getCachedPortfolioTotals] Retrieving cached portfolio totals for portfolioId: {}",
        portfolioId != null ? portfolioId : "ALL");

    Map<String, Object> totals = new HashMap<>();

    // Try to get all metrics from cache
    boolean allMetricsCached = true;

    for (String metricKey : getAllMetricKeys()) {
      Optional<CompanyDataExtractionMetrics> cachedMetric;

      if (portfolioId == null) {
        cachedMetric = metricsRepository.findFirstByMetricKeyAndPortfolioIdIsNullOrderByIdDesc(metricKey);
      } else {
        cachedMetric = metricsRepository.findFirstByMetricKeyAndPortfolioIdOrderByIdDesc(metricKey, portfolioId);
      }

      if (cachedMetric.isPresent()) {
        CompanyDataExtractionMetrics metric = cachedMetric.get();
        if (metric.getMetricValue() != null) {
          totals.put(metricKey, convertMetricValue(metric.getMetricValue()));
        } else if (metric.getStringValue() != null) {
          totals.put(metricKey, metric.getStringValue());
        }
      } else {
        allMetricsCached = false;
        break;
      }
    }

    if (allMetricsCached) {
      log.info("[getCachedPortfolioTotals] All metrics found in cache for portfolioId: {}, returning cached values",
          portfolioId != null ? portfolioId : "ALL");
      return totals;
    }

    // If any metrics are missing, recalculate and cache all
    log.info("[getCachedPortfolioTotals] Some metrics missing from cache for portfolioId: {}, recalculating...",
        portfolioId != null ? portfolioId : "ALL");
    return recalculateAndCacheMetrics(portfolioId);
  }

  /**
   * Force recalculation of all global metrics and update cache.
   *
   * @return Map containing all portfolio metrics
   */
  @Transactional
  public Map<String, Object> recalculateAndCacheMetrics() {
    return recalculateAndCacheMetrics(null);
  }

  /**
   * Force recalculation of metrics for a specific portfolio and update cache.
   *
   * @param portfolioId the portfolio ID (null for global metrics)
   * @return Map containing all portfolio metrics
   */
  @Transactional
  public Map<String, Object> recalculateAndCacheMetrics(Long portfolioId) {
    log.info("[recalculateAndCacheMetrics] Recalculating portfolio metrics for portfolioId: {}",
        portfolioId != null ? portfolioId : "ALL");

    // Calculate fresh metrics using existing service
    Map<String, Object> freshTotals = companyExtractionDataService.calculatePortfolioTotals(portfolioId);

    LocalDateTime now = LocalDateTime.now();

    // Cache each metric using save/update approach
    for (Map.Entry<String, Object> entry : freshTotals.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();

      // Find existing metric or create new one
      CompanyDataExtractionMetrics metric;
      if (portfolioId == null) {
        metric = metricsRepository.findFirstByMetricKeyAndPortfolioIdIsNullOrderByIdDesc(key)
            .orElse(new CompanyDataExtractionMetrics());
      } else {
        metric = metricsRepository.findFirstByMetricKeyAndPortfolioIdOrderByIdDesc(key, portfolioId)
            .orElse(new CompanyDataExtractionMetrics());
      }

      metric.setMetricKey(key);
      metric.setPortfolioId(portfolioId);
      metric.setLastCalculated(now);
      metric.setUpdatedAt(now);

      if (metric.getCreatedAt() == null) {
        metric.setCreatedAt(now);
      }

      if (value instanceof Number) {
        BigDecimal numericValue = BigDecimal.valueOf(((Number) value).doubleValue());
        metric.setMetricValue(numericValue);
        metric.setStringValue(null); // Clear string value
      } else if (value instanceof String) {
        metric.setStringValue((String) value);
        metric.setMetricValue(null); // Clear numeric value
      }

      metricsRepository.save(metric);
    }

    log.info("[recalculateAndCacheMetrics] Cached {} metrics successfully for portfolioId: {}",
        freshTotals.size(), portfolioId != null ? portfolioId : "ALL");
    return freshTotals;
  }

  /**
   * Invalidate all cached metrics.
   * Call this when company data changes.
   */
  @Transactional
  public void invalidateCache() {
    log.info("[invalidateCache] Invalidating all cached metrics");
    metricsRepository.deleteAllMetrics();
    log.info("[invalidateCache] Cache invalidated successfully");
  }

  /**
   * Invalidate cached metrics for a specific portfolio.
   * Call this when portfolio data changes.
   *
   * @param portfolioId the portfolio ID
   */
  @Transactional
  public void invalidatePortfolioCache(Long portfolioId) {
    if (portfolioId == null) {
      log.info("[invalidatePortfolioCache] Invalidating global cached metrics");
      metricsRepository.deleteGlobalMetrics();
    } else {
      log.info("[invalidatePortfolioCache] Invalidating cached metrics for portfolio: {}", portfolioId);
      metricsRepository.deleteMetricsByPortfolioId(portfolioId);
    }
    log.info("[invalidatePortfolioCache] Portfolio cache invalidated successfully");
  }

  /**
   * Get all metric keys that should be cached.
   */
  private String[] getAllMetricKeys() {
    return new String[]{
      TOTAL_COMPANIES,
      TOTAL_EMPLOYEES,
      TOTAL_PATENTS,
      TOTAL_SOCIAL_MEDIA_FOLLOWERS,
      TOTAL_DAILY_TRAFFIC,
      COMPANIES_WITH_REPORTS,
      TOTAL_SALES,
      TOTAL_SALES_RAW,
      TOTAL_SALES_CURRENCY,
      TOTAL_CARBON_EMISSIONS,
      TOTAL_SCOPE1_EMISSIONS,
      TOTAL_SCOPE2_EMISSIONS,
      TOTAL_SCOPE3_EMISSIONS,
      COMPANIES_WITH_EMISSIONS
    };
  }

  private Number convertMetricValue(BigDecimal value) {
    if (value == null) {
      return 0L;
    }
    BigDecimal normalized = value.stripTrailingZeros();
    if (normalized.scale() <= 0) {
      return normalized.longValue();
    }
    return normalized.doubleValue();
  }
}
