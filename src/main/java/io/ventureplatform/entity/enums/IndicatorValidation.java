package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum IndicatorValidation implements ScoringIndicator, DeserializableEnum {
  LOW("No validation, rough idea of indicator", "Validation not started [1/5]", 1d),
  SLIGHTLY_IMPORTANT("No validation, indicator clearly defined", "Poor measurement quality [2/5]", 2d),
  MODERATELY_IMPORTANT("First data collected (i.e. on prototype)", "Medium measurement quality [3/5]", 3d),
  VERY_IMPORTANT("At least one year of data collected", "Good measurement quality [4/5]", 4d),
  EXTREMELY_IMPORTANT("Several years of data collected", "Very good measurement quality [5/5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  IndicatorValidation(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
