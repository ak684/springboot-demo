package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.IndicatorNoisiness;
import io.ventureplatform.entity.enums.IndicatorValidation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IndicatorScoreResponse extends BaseResponse {
  private ImpactIndicatorResponse indicator;
  private IndicatorValidation validation;
  private String validationExplanation;
  private IndicatorNoisiness noisiness;
  private String noisinessExplanation;
}
