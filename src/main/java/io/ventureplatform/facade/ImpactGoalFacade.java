package io.ventureplatform.facade;

import io.ventureplatform.dto.request.ImpactGoalRequest;
import io.ventureplatform.dto.response.ImpactGoalResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactGoal;
import io.ventureplatform.service.ImpactGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ImpactGoalFacade extends AbstractDtoFacade<ImpactGoalRequest, ImpactGoalResponse, ImpactGoal> {
  private final ImpactGoalService impactGoalService;

  public void saveGoals(List<ImpactGoalRequest> goals, Impact impact) {
    impactGoalService.saveGoals(dtosToEntityList(goals), impact);
  }
}
