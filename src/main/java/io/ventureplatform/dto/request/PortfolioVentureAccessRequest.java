package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.AccessType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioVentureAccessRequest extends BaseRequest {
  private AccessType access;
  private Boolean hidden;
  private Boolean publicHidden;
}
