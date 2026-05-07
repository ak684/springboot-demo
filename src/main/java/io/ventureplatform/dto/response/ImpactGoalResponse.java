package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.SustainableDevelopmentGoal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactGoalResponse extends BaseResponse {
  private SustainableDevelopmentGoal goal;
  private Integer rate;
  private String shortName;
}
