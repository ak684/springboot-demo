package io.ventureplatform.dto;

import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.Industry;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO containing flattened portfolio data for aggregated view
 * Each row represents: Organization -> Impact Chain -> Indicator -> Values
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class AggregatedPortfolioData {
  // Organization/Venture fields
  private Long ventureId;
  private String ventureName;
  private String ventureDescription;
  private String ventureLogo;
  private List<Industry> industries = new ArrayList<>();
  private Geography country;
  private String website;
  private Boolean active;

  // Impact Chain fields
  private Long impactId;
  private String impactName;
  private String statusQuo;
  private String innovation;
  private String stakeholders;
  private String change;
  private Boolean positive;

  // Indicator fields
  private Long indicatorId;
  private String indicatorName;
  private String indicatorDescription;
  private MeasurementUnit unit;
  private String owner;

  // Quantification data - using maps for flexibility
  private Map<Integer, Double> forecastValues = new HashMap<>(); // year -> POST value
  private Map<Integer, Double> actualValues = new HashMap<>();   // year -> POST value
  private Map<Integer, Double> forecastPreValues = new HashMap<>(); // year -> PRE value (baseline)
  private Map<Integer, Double> actualPreValues = new HashMap<>();   // year -> PRE value (baseline)

  // Additional metadata
  private Double totalScore;
  private String lastUpdated;
  private Integer sortOrder;
}
