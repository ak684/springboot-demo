package io.ventureplatform.dto.request;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;

@Data
public class GetPitchAccessRequest {
  @NotEmpty
  private String name;
  @NotEmpty
  private String lastName;
  @NotEmpty
  @Email
  private String email;
  @NotEmpty
  private String organization;
  private String message;
}
