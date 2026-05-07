package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum StakeholderSituationNegative implements ScoringIndicator, DeserializableEnum {
  VERY_WELL_SERVED("Very well served – (e.g. improving self-esteem of individuals)", "Very well served [-1/-5]", 1d),
  WELL_SERVED("Well served – (e.g. increasing well-being)", "Well served [-2/-5]", 2d),
  SLIGHTLY_UNDERSERVED("Slightly underserved – (e.g. improving living conditions)", "Slightly underserved [-3/-5]", 3d),
  PARTIALLY_UNDERSERVED(
    "Partially underserved – (e.g. basic needs of individuals unfulfilled)",
    "Partially underserved [-4/-5]",
    4d
  ),
  COMPLETELY_UNDERSERVED(
    "Completely underserved – (e.g. change decides about saving lives)",
    "Completely underserved [-5/-5]",
    5d
  );

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  StakeholderSituationNegative(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
