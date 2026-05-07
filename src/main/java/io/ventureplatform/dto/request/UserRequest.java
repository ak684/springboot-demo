package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRequest extends BaseRequest {
  private String email;
  private String name;
  private String password;
  private String lastName;
  private String company;
  private String position;
  private Geography country;
}
