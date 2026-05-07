package io.ventureplatform.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Data
public class UserConfigUpdateRequest {
  @NotEmpty
  private String name;
  @NotNull
  private Object value;
}
