package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum IndicatorPitchView implements DeserializableEnum {
  NET_IMPACT("5-year net impact", "5-year net impact"),
  RELATIVE_CHANGE("Percentage improvement", "Percentage change"),
  ABSOLUTE_CHANGE("Absolute improvement", "Absolute change"),
  YEAR_START("Measurement start year", "Measurement start year");

  private final String name;
  private final String type;
  private final String description;
  private final String descriptionNegative;

  IndicatorPitchView(String description, String descriptionNegative) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.descriptionNegative = descriptionNegative;
  }
}
