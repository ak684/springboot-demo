package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.EmployeeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamMemberRequest extends BaseRequest {
  @NotEmpty
  private String name;
  private String lastName;
  @Email
  private String email;
  @NotEmpty
  private String position;
  private String avatar;
  private String linkedin;
  @NotNull
  private EmployeeType type;
  private Integer sortOrder;
}
