package io.ventureplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO for custom aggregated indicators created by wizard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class AggregatedIndicator {
  private Long id;
  private String name;
  private String nameSlovak;
  private String description;
  private String category;
  private AggregationType aggregationType; // SUM, AVERAGE
  private List<Long> ventureIds = new ArrayList<>();
  private List<DataSourceReference> dataSources = new ArrayList<>();
  private String timePeriod; // current, last5, inception, etc.
  private List<Integer> selectedYears = new ArrayList<>();
  private String timeRange;
  private Double calculatedValue; // primary calculated value
  private Map<String, Double> calculatedValues = new HashMap<>(); // values per time period
  private Map<String, List<ComponentValue>> componentBreakdowns = new HashMap<>(); // component breakdown per time period
  private Double yearOverYearChange;
  private String unit;
  private String unitSlovak;
  private String createdBy;
  private String createdAt;
  
  // Parent-child relationship fields
  private Boolean isMain = true;
  private Integer hoverSlot;
  private Long parentIndicatorId;
  
  // Additional fields for wizard
  private String indicatorType; // "main" or "hover"
  private String timePeriodEnglish; // English time period label
  private String timePeriodSlovak;
  private Integer displayOrder; // For internal ordering
  
  // Number formatting options
  private Integer decimalPlaces = 0; // Default to no decimals
  private String numberFormat = "EU"; // "US" or "EU"
  
  // Continuous counter feature
  private Boolean continuousCounter = false;

  public enum AggregationType {
    SUM, AVERAGE
  }
}
