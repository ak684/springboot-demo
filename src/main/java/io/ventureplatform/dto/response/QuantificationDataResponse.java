package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.QuantificationDataType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class QuantificationDataResponse extends BaseResponse {
  private Integer year;
  private Double jan;
  private Double feb;
  private Double mar;
  private Double apr;
  private Double may;
  private Double jun;
  private Double jul;
  private Double aug;
  private Double sep;
  private Double oct;
  private Double nov;
  private Double dec;
  private QuantificationDataType type;
}
