package io.ventureplatform.service;

import io.ventureplatform.entity.FundingRound;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.FundingRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FundingRoundService extends AbstractBaseEntityService<FundingRound> {
  private final FundingRoundRepository fundingRoundRepository;

  public FundingRound addFundingRound(FundingRound round, Venture venture) {
    round.setVenture(venture);
    return fundingRoundRepository.save(round);
  }

  public FundingRound editFundingRound(FundingRound update, FundingRound existing) {
    BeanUtils.copyProperties(update, existing, "id", "venture");
    return fundingRoundRepository.save(existing);
  }
}
