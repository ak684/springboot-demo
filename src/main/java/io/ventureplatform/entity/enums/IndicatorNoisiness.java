package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum IndicatorNoisiness implements ScoringIndicator, DeserializableEnum {
  VERY_NOISY("Very noisy indicator", "Very noisy indicator [1/5]", 1d),
  SLIGHTLY_NOISY("Slightly noisy indicator", "Slightly noisy indicator [2/5]", 2d),
  MEDIUM("Neither noisy nor exact indicator", "Neither noisy nor exact indicator [3/5]", 3d),
  CLOSE("Indicator close to intended change", "Indicator close to intended change [4/5]", 4d),
  EXACT("Indicator measures exactly the change", "Indicator measures exactly the change [5/5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  IndicatorNoisiness(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
