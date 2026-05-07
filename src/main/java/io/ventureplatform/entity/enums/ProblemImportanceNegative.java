package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum ProblemImportanceNegative implements ScoringIndicator, DeserializableEnum {
  LOW("Low importance", "Low importance [-1/-5]", 1d),
  SLIGHTLY_IMPORTANT("Slightly important", "Slightly important [-2/-5]", 2d),
  MODERATELY_IMPORTANT("Moderately important", "Moderately important [-3/-5]", 3d),
  VERY_IMPORTANT("Very important", "Very important [-4/-5]", 4d),
  EXTREMELY_IMPORTANT("Extremely important", "Extremely important [-5/-5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  ProblemImportanceNegative(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
