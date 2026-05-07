package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class PortfolioMemberAccessResponse extends BaseResponse {
  private UserResponse member;
  private AccessType access;
  private InvitationStatus status;
}
