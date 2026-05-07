package io.ventureplatform.repository;

import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.IndicatorScore;
import org.springframework.stereotype.Repository;

@Repository
public interface IndicatorScoreRepository extends BaseEntityRepository<IndicatorScore> {
  void deleteAllByIndicator(ImpactIndicator indicator);
}
