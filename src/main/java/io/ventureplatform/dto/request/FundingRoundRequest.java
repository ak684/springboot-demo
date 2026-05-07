package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.FundingRoundType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FundingRoundRequest extends BaseRequest {
  @NotNull
  private FundingRoundType type;
  @NotNull
  private LocalDate date;
  private Double amount;
  private List<InvestorRequest> investors;
}
