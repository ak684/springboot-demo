package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum PreviousEvidenceNegative implements ScoringIndicator, DeserializableEnum {
  VERY_LOW("Likelihood very low", "Likelihood very low [-1/-5]", 1d),
  LOW("Likelihood low", "Likelihood low [-2/-5]", 2d),
  MEDIUM("Medium likelihood", "Medium likelihood [-3/-5]", 3d),
  HIGH("High likelihood", "High likelihood [-4/-5]", 4d),
  CERTAIN("Negative impact certain", "Negative impact certain [-5/-5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  PreviousEvidenceNegative(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
