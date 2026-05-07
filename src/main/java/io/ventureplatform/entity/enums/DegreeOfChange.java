package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum DegreeOfChange implements ScoringIndicator {
  ONE_PERCENT(
    "1% or smaller (e.g. impact on climate change, often systems level impact)",
    "1% improvement or smaller [1%/100%]",
    1.1d
  ),
  TEN_PERCENT("Marginal improvement, just noticeable", "10% improvement [10%/100%]", 1.9d),
  TWENTY_PERCENT("Rather small improvement, noticeable", "20% improvement [20%/100%]", 2.8d),
  THIRTY_PERCENT("Small improvement", "30% improvement [30%/100%]", 3.7d),
  FORTY_PERCENT("Small to moderate improvement", "40% improvement [40%/100%]", 4.6d),
  FIFTY_PERCENT("Moderate improvement", "50% improvement [50%/100%]", 5.5d),
  SIXTY_PERCENT("Moderate to high improvement", "60% improvement [60%/100%]", 6.4d),
  SEVENTY_PERCENT("High improvement", "70% improvement [70%/100%]", 7.3d),
  EIGHTY_PERCENT("Very high improvement", "80% improvement [80%/100%]", 8.2d),
  NINETY_PERCENT("Extremely high improvement", "90% improvement [90%/100%]", 9.1d),
  HUNDRED_PERCENT(
    "Problem completely solved, or improvement > 100%",
    "100 % (Problem completely solved, or improvement > 100%)",
    10d
  );

  private final String name;
  private final String description;
  private final String shortName;
  private final Double score;

  DegreeOfChange(String description, String shortName, Double score) {
    this.name = this.name();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
