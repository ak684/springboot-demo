package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.SustainableDevelopmentGoal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactGoalRequest extends BaseRequest {
  @NotNull
  private SustainableDevelopmentGoal goal;
  private Integer rate;
}
