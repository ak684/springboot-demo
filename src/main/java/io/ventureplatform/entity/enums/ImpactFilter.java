package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ImpactFilter {
  NEGATIVE("negative"),
  POSITIVE("positive"),
  DRAFT("draft"),
  NOT_DRAFT("not_draft");

  private final String label;

  ImpactFilter(String label) {
    this.label = label;
  }

  @JsonValue
  public String getLabel() {
    return label;
  }
}
