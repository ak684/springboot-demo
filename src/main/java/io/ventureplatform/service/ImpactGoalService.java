package io.ventureplatform.service;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactGoal;
import io.ventureplatform.repository.ImpactGoalRepository;
import io.ventureplatform.repository.ImpactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpactGoalService extends AbstractBaseEntityService<ImpactGoal> {
  private final ImpactRepository impactRepository;
  private final ImpactGoalRepository impactGoalRepository;

  @Transactional
  public void saveGoals(List<ImpactGoal> goals, Impact impact) {
    impactGoalRepository.deleteAllByImpact(impact);
    goals.forEach(g -> g.setImpact(impact));
    impact.getGoals().clear();
    impact.getGoals().addAll(goals);
    impactRepository.save(impact);
  }
}
