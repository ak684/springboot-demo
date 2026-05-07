package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum FundingRoundType implements DeserializableEnum {
  PRE_SEED("Pre-seed"),
  SEED("Seed"),
  SERIES_A("Series A"),
  SERIES_B("Series B"),
  SERIES_C("Series C"),
  SERIES_D("Series D"),
  SERIES_E("Series E"),
  PRE_IPO("Pre IPO"),
  IPO("IPO");

  private final String name;
  private final String type;
  private final String label;

  FundingRoundType(String label) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.label = label;
  }
}
