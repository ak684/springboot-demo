package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.AccessType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.validation.constraints.NotNull;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class CompanyMemberAccessRequest extends BaseRequest {
  @NotNull
  private Long companyId;

  @NotNull
  private AccessType access;
}
