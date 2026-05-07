package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity to store cached metrics for company data extraction.
 * Improves performance by avoiding recalculation of expensive aggregations.
 */
@Entity
@Table(name = "company_data_extraction_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class CompanyDataExtractionMetrics {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "metric_key", nullable = false)
  private String metricKey;

  @Column(name = "portfolio_id")
  private Long portfolioId;

  @Column(name = "metric_value", precision = 20, scale = 2)
  private BigDecimal metricValue;

  @Column(name = "string_value", columnDefinition = "TEXT")
  private String stringValue;

  @Column(name = "last_calculated", nullable = false)
  private LocalDateTime lastCalculated;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Convenience constructors
  public CompanyDataExtractionMetrics(String metricKey, BigDecimal metricValue) {
    this.metricKey = metricKey;
    this.metricValue = metricValue;
    this.lastCalculated = LocalDateTime.now();
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public CompanyDataExtractionMetrics(String metricKey, String stringValue) {
    this.metricKey = metricKey;
    this.stringValue = stringValue;
    this.lastCalculated = LocalDateTime.now();
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public CompanyDataExtractionMetrics(String metricKey, Long longValue) {
    this.metricKey = metricKey;
    this.metricValue = BigDecimal.valueOf(longValue);
    this.lastCalculated = LocalDateTime.now();
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }
}
