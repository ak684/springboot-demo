package io.ventureplatform.repository;

import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.QuantificationData;
import org.springframework.stereotype.Repository;

@Repository
public interface QuantificationDataRepository extends BaseEntityRepository<QuantificationData> {
  void deleteAllByIndicator(ImpactIndicator indicator);
}
