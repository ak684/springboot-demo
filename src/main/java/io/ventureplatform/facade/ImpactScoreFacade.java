package io.ventureplatform.facade;

import io.ventureplatform.dto.request.ImpactScoreRequest;
import io.ventureplatform.dto.response.ImpactScoreResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.service.ImpactScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ImpactScoreFacade extends AbstractDtoFacade<ImpactScoreRequest, ImpactScoreResponse, ImpactScore> {
  private final ImpactScoreService impactScoreService;

  public ImpactScoreResponse getScore(ImpactScoreRequest request, Impact impact) {
    return impactScoreService.getScore(dtoToEntity(request), impact);
  }

  public Map<String, Double> getImprovementPotential(Impact impact) {
    return impactScoreService.getImprovementPotential(impact);
  }
}
