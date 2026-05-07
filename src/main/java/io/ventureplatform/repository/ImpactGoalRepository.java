package io.ventureplatform.repository;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactGoal;
import org.springframework.stereotype.Repository;

@Repository
public interface ImpactGoalRepository extends BaseEntityRepository<ImpactGoal> {
  void deleteAllByImpact(Impact impact);
}
