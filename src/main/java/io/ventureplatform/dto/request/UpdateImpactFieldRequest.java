package io.ventureplatform.dto.request;

import io.ventureplatform.dto.validation.Conditional;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Conditional(selected = "field", values = {"indicators"}, required = {"indicatorId"})
@Conditional(
  selected = "field",
  values = {"name", "statusQuo", "innovation", "stakeholders", "change", "outputUnits", "indicators"},
  required = {"value"})
public class UpdateImpactFieldRequest extends BaseRequest {
  @Pattern(regexp = "name|statusQuo|innovation|stakeholders|change|outputUnits|indicators|image")
  @NotNull
  private String field;
  private String value;
  private Long indicatorId;
}
