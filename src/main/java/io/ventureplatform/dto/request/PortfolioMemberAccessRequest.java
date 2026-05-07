package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.AccessType;
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
public class PortfolioMemberAccessRequest extends BaseRequest {
  private PortfolioRequest portfolio;
  private AccessType access;
}
