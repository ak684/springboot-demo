package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum SizeOfStakeholdersNegative implements ScoringIndicator, DeserializableEnum {
  TEN("0 - 10 over next 5 years", "0 - 10 over next 5 years [-1/-10]", 1d),
  HUNDRED("11 - 100 over next 5 years", "11 - 100 over next 5 years [-2/-10]", 2d),
  FIVE_HUNDRED("101 - 500 over next 5 years", "101 - 500 over next 5 years [-3/-10]", 3d),
  THOUSAND("501 - 1.000 over next 5 years", "501 - 1.000 over next 5 years [-4/-10]", 4d),
  TEN_THOUSAND("1.001  - 10.000 over next 5 years", "1.001  - 10.000 over next 5 years [-5/-10]", 5d),
  HUNDRED_THOUSAND("10.001 - 100.000 over next 5 years", "10.001 - 100.000 over next 5 years [-6/-10]", 6d),
  MILLION("100.001 - 1 Mio over next 5 years", "100.001 - 1 Mio over next 5 years [-7/-10]", 7d),
  TEN_MILLION("1 Mio - 10 Mio. over next 5 years", "1 Mio - 10 Mio. over next 5 years [-8/-10]", 8d),
  HUNDRED_MILLION("10. Mio - 100 Mio. over next 5 years", "10. Mio - 100 Mio. over next 5 years [-9/-10]", 9d),
  BILLIONS("Billions over next 5 years", "Billions over next 5 years [-10/-10]", 10d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  SizeOfStakeholdersNegative(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
