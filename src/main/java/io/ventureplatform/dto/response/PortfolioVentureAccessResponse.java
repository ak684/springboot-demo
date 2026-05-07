package io.ventureplatform.dto.response;

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
public class PortfolioVentureAccessResponse extends BaseResponse {
  private VentureResponse venture;
  private AccessType access;
  private Boolean hidden;
  private Boolean publicHidden;
}
