package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.IndicatorQuantificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class IndicatorQuantificationDataRequest extends BaseRequest {
  @NotNull
  private Integer year;
  @Min(0)
  private Double value;
  private IndicatorQuantificationType type;
}
