package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum Duration implements ScoringIndicator, DeserializableEnum {
  VERY_SHORT("Only very short term improvement (e.g. a few hours or days)", "Duration very short term [1/5]", 1d),
  SHORT_TERM("Short term (e.g. weeks to months)", "Duration short term [2/5]", 2d),
  MEDIUM_TERM("Medium term (e.g. 3-5 years)", "Duration medium term [3/5]", 3d),
  LONG_TERM("Long term (e.g. most likely 5 years plus)", "Duration long-term [4/5]", 4d),
  FOREVER("Forever (e.g. permanent solution provided for stakeholder)", "Duration permanent solution [5/5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  Duration(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
