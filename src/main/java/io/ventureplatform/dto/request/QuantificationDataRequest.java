package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.QuantificationDataType;
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
public class QuantificationDataRequest extends BaseRequest {
  @NotNull
  private Integer year;
  @Min(0)
  private Double jan;
  @Min(0)
  private Double feb;
  @Min(0)
  private Double mar;
  @Min(0)
  private Double apr;
  @Min(0)
  private Double may;
  @Min(0)
  private Double jun;
  @Min(0)
  private Double jul;
  @Min(0)
  private Double aug;
  @Min(0)
  private Double sep;
  @Min(0)
  private Double oct;
  @Min(0)
  private Double nov;
  @Min(0)
  private Double dec;
  @NotNull
  private QuantificationDataType type;
}
