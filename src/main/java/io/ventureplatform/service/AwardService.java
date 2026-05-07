package io.ventureplatform.service;

import io.ventureplatform.entity.Award;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.AwardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AwardService extends AbstractBaseEntityService<Award> {
  private final AwardRepository awardRepository;

  public Award addAward(Award reward, Venture venture) {
    reward.setVenture(venture);
    return awardRepository.save(reward);
  }

  public Award editAward(Award update, Award existing) {
    BeanUtils.copyProperties(update, existing, "id", "venture");
    return awardRepository.save(existing);
  }
}
