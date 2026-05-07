package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioPublicSettingsResponse extends BaseResponse {
  private Boolean shared;
  private String missionImage;
}
