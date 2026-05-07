package io.ventureplatform.dto.request;

import io.ventureplatform.dto.validation.FieldMatch;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
@FieldMatch.List(
  {
    @FieldMatch(field = "password", fieldMatch = "confirmPassword", message = "Passwords do not match")
  })
public class ResetPasswordRequest {
  @NotNull
  private String token;

  @NotBlank
  @Size(min = 6, message = "Your password is too short. Minimum length is 4 symbols")
  private String password;

  @NotBlank
  private String confirmPassword;
}
