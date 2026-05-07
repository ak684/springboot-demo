package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.IndicatorQuantificationType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class IndicatorQuantificationDataResponse extends BaseResponse {
  private Integer year;
  private Double value;
  private IndicatorQuantificationType type;
}
