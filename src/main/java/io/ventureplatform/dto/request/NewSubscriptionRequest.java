package io.ventureplatform.dto.request;

import lombok.Data;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@Data
public class NewSubscriptionRequest {
  @NotNull
  @Pattern(regexp = "month|year")
  private String period;
  @Pattern(regexp = "basic|pro")
  @NotNull
  private String type;
  private Boolean newVenture = false;
}
