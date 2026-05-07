package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.FundingRoundType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FundingRoundResponse extends BaseResponse {
  private FundingRoundType type;
  private LocalDate date;
  private Double amount;
  private List<InvestorResponse> investors = new ArrayList<>();
}
