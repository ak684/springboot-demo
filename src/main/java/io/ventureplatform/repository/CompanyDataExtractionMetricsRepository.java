package io.ventureplatform.repository;

import io.ventureplatform.entity.CompanyDataExtractionMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for CompanyDataExtractionMetrics entities.
 * Provides data access operations for cached metrics.
 */
@Repository
public interface CompanyDataExtractionMetricsRepository extends JpaRepository<CompanyDataExtractionMetrics, Long> {

  /**
   * Find a metric by its key (for global metrics without portfolio).
   * Uses findFirst to handle potential duplicate entries gracefully.
   *
   * @param metricKey the metric key
   * @return Optional containing the metric if found
   */
  Optional<CompanyDataExtractionMetrics> findFirstByMetricKeyAndPortfolioIdIsNullOrderByIdDesc(String metricKey);

  /**
   * Find a metric by its key and portfolio ID.
   * Uses findFirst to handle potential duplicate entries gracefully.
   *
   * @param metricKey the metric key
   * @param portfolioId the portfolio ID
   * @return Optional containing the metric if found
   */
  Optional<CompanyDataExtractionMetrics> findFirstByMetricKeyAndPortfolioIdOrderByIdDesc(String metricKey, Long portfolioId);

  /**
   * Check if a metric exists by key and portfolio.
   *
   * @param metricKey the metric key
   * @param portfolioId the portfolio ID
   * @return true if exists, false otherwise
   */
  boolean existsByMetricKeyAndPortfolioId(String metricKey, Long portfolioId);

  // Note: Using JPA save() method instead of custom upsert queries for better compatibility

  /**
   * Delete all cached metrics (for cache invalidation).
   */
  @Modifying
  @Query("DELETE FROM CompanyDataExtractionMetrics")
  void deleteAllMetrics();

  /**
   * Delete all cached metrics for a specific portfolio.
   *
   * @param portfolioId the portfolio ID
   */
  @Modifying
  @Query("DELETE FROM CompanyDataExtractionMetrics WHERE portfolioId = :portfolioId")
  void deleteMetricsByPortfolioId(@Param("portfolioId") Long portfolioId);

  /**
   * Delete all global cached metrics (where portfolio_id is null).
   */
  @Modifying
  @Query("DELETE FROM CompanyDataExtractionMetrics WHERE portfolioId IS NULL")
  void deleteGlobalMetrics();

  /**
   * Delete metrics older than specified time.
   * 
   * @param cutoffTime the cutoff time
   */
  @Modifying
  @Query("DELETE FROM CompanyDataExtractionMetrics WHERE lastCalculated < :cutoffTime")
  void deleteMetricsOlderThan(@Param("cutoffTime") LocalDateTime cutoffTime);
}
