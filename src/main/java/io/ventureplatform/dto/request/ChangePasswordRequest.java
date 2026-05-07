package io.ventureplatform.dto.request;

import io.ventureplatform.dto.validation.FieldMatch;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@FieldMatch.List(
  {
    @FieldMatch(field = "newPassword", fieldMatch = "confirmPassword", message = "Passwords do not match")
  })
public class ChangePasswordRequest {
  private String password;

  @NotBlank
  @Size(min = 6, message = "Your password is too short. Minimum length is 6 symbols")
  private String newPassword;

  @NotBlank
  private String confirmPassword;
}
