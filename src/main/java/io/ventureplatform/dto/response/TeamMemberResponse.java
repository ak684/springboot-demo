package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.EmployeeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamMemberResponse extends BaseResponse {
  private String name;
  private String lastName;
  private String email;
  private String position;
  private String avatar;
  private String linkedin;
  private EmployeeType type;
  private Integer sortOrder;
}
