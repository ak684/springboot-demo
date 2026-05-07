package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum DegreeOfChangeNegative implements ScoringIndicator {
  ONE_PERCENT(
    "1% worse or smaller",
    "1% worse or smaller [-1%/-100%]",
    1.1d
  ),
  TEN_PERCENT("10% worse", "10% worse [-10%/-100%]", 1.9d),
  TWENTY_PERCENT("20% worse", "20% worse [-20%/-100%]", 2.8d),
  THIRTY_PERCENT("30% worse", "30% worse [-30%/-100%]", 3.7d),
  FORTY_PERCENT("40% worse", "40% worse [-40%/-100%]", 4.6d),
  FIFTY_PERCENT("50% worse", "50% worse [-50%/-100%]", 5.5d),
  SIXTY_PERCENT("60% worse", "60% worse [-60%/-100%]", 6.4d),
  SEVENTY_PERCENT("70% worse", "70% worse [-70%/-100%]", 7.3d),
  EIGHTY_PERCENT("80% worse", "80% worse [-80%/-100%]", 8.2d),
  NINETY_PERCENT("90% worse", "90% worse [-90%/-100%]", 9.1d),
  HUNDRED_PERCENT("100% worse or more", "100% worse or more [-100%/-100%]", 10d);

  private final String name;
  private final String description;
  private final String shortName;
  private final Double score;

  DegreeOfChangeNegative(String description, String shortName, Double score) {
    this.name = this.name();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
