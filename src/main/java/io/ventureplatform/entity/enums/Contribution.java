package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum Contribution implements ScoringIndicator {
  ONE_PERCENT("99% of change would have happened/will happen without us anyways", "1% [1%/100%]", 1.1d),
  TEN_PERCENT("90% of change would have happened/will happen without us anyways", "10% [10%/100%]", 1.9d),
  TWENTY_PERCENT("80% of change would have happened/will happen without us anyways", "20% [20%/100%]", 2.8d),
  THIRTY_PERCENT("70% of change would have happened/will happen without us anyways", "30% [30%/100%]", 3.7d),
  FORTY_PERCENT("60% of change would have happened/will happen without us anyways", "40% [40%/100%]", 4.6d),
  FIFTY_PERCENT("50% of change would have happened/will happen without us anyways", "50% [50%/100%]", 5.5d),
  SIXTY_PERCENT("40% of change would have happened/will happen without us anyways", "60% [60%/100%]", 6.4d),
  SEVENTY_PERCENT("30% of change would have happened/will happen without us anyways", "70% [70%/100%]", 7.3d),
  EIGHTY_PERCENT("20% of change would have happened/will happen without us anyways", "80% [80%/100%]", 8.2d),
  NINETY_PERCENT("10% of change would have happened/will happen without us anyways", "90% [90%/100%]", 9.1d),
  HUNDRED_PERCENT("No change would have happened/will happen without us", "100% [100%/100%]", 10d);

  private final String name;
  private final String description;
  private final String shortName;
  private final Double score;

  Contribution(String description, String shortName, Double score) {
    this.name = this.name();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
