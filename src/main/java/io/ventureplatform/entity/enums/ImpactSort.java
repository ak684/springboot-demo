package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ImpactSort {
  BY_SCORE("score"),
  BY_MAGNITUDE("magnitude"),
  BY_LIKELIHOOD("likelihood"),
  CUSTOM("custom");

  private final String label;

  ImpactSort(String label) {
    this.label = label;
  }

  @JsonValue
  public String getLabel() {
    return label;
  }
}
