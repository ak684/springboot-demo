package io.ventureplatform.repository;

import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.IndicatorQuantificationData;
import org.springframework.stereotype.Repository;

@Repository
public interface IndicatorQuantificationDataRepository extends BaseEntityRepository<IndicatorQuantificationData> {
  void deleteAllByIndicator(ImpactIndicator indicator);
}
