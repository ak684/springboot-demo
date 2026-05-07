package io.ventureplatform.dto.request;

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
public class IndicatorScoreRequest extends BaseRequest {
  private ImpactIndicatorRequest indicator;
  private IndicatorValidation validation;
  private String validationExplanation;
  private IndicatorNoisiness noisiness;
  private String noisinessExplanation;
}
