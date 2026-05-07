package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum IndicatorPublicView implements DeserializableEnum {
  ABSOLUTE_IMPROVEMENT("Absolute improvement"),
  PERCENTAGE_IMPROVEMENT("Percentage improvement"),
  NET_IMPACT_INCEPTION("Net impact since inception"),
  NET_IMPACT_CURRENT("Net impact current year"),
  YEAR("Measurement start year");

  private final String name;
  private final String type;
  private final String description;

  IndicatorPublicView(String description) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
  }
}
