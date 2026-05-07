package io.ventureplatform.facade;

import io.ventureplatform.dto.request.FundingRoundRequest;
import io.ventureplatform.dto.response.FundingRoundResponse;
import io.ventureplatform.entity.FundingRound;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.FundingRoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FundingRoundFacade
  extends AbstractDtoFacade<FundingRoundRequest, FundingRoundResponse, FundingRound> {
  private final FundingRoundService fundingRoundService;

  public FundingRoundResponse addFundingRound(FundingRoundRequest request, Venture venture) {
    return entityToDto(fundingRoundService.addFundingRound(dtoToEntity(request), venture));
  }

  public FundingRoundResponse editFundingRound(FundingRoundRequest request, FundingRound existing) {
    return entityToDto(fundingRoundService.editFundingRound(dtoToEntity(request), existing));
  }
}
