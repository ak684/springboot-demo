package io.ventureplatform.entity;

import io.ventureplatform.dto.AggregatedIndicator.AggregationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "aggregated_indicators")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class AggregatedIndicator extends BaseEntity {

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "name_slovak")
  private String nameSlovak;

  @Column(name = "category")
  private String category;

  @Column(name = "unit")
  private String unit;

  @Column(name = "unit_slovak")
  private String unitSlovak;

  @Column(name = "time_period")
  private String timePeriod;

  @Column(name = "time_period_english")
  private String timePeriodEnglish;

  @Column(name = "time_period_slovak")
  private String timePeriodSlovak;

  // Parent-child relationship for main/hover indicators
  @Column(name = "is_main", nullable = false)
  private Boolean isMain = true;

  @Column(name = "hover_slot")
  private Integer hoverSlot; // null for main, 1/2/3 for hovers

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_indicator_id")
  private AggregatedIndicator parentIndicator;

  // Core data
  @Column(name = "portfolio_id", nullable = false)
  private Long portfolioId;

  @Column(name = "data_sources_json", columnDefinition = "TEXT")
  private String dataSourcesJson; // JSON string of DataSourceReference list

  @Column(name = "aggregation_type")
  @Enumerated(EnumType.STRING)
  private AggregationType aggregationType; // SUM or AVERAGE

  // For ordering
  @Column(name = "display_order")
  private Integer displayOrder;

  // Additional fields
  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "venture_ids_json", columnDefinition = "TEXT")
  private String ventureIdsJson; // JSON array of venture IDs

  @Column(name = "selected_year")
  private Integer selectedYear; // Single year selection

  // Calculated values stored for performance
  @Column(name = "calculated_value")
  private Double calculatedValue;

  @Column(name = "component_breakdown_json", columnDefinition = "TEXT")
  private String componentBreakdownJson; // JSON string of component values
  
  // Number formatting options
  @Column(name = "decimal_places")
  private Integer decimalPlaces = 0;
  
  @Column(name = "number_format")
  private String numberFormat = "EU"; // "US" or "EU"
  
  // Continuous counter feature
  @Column(name = "continuous_counter")
  private Boolean continuousCounter = false;
}
