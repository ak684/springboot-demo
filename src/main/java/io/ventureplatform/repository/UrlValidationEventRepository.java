package io.ventureplatform.repository;

import io.ventureplatform.entity.UrlValidationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for URL validation events.
 */
@Repository
public interface UrlValidationEventRepository
  extends JpaRepository<UrlValidationEvent, Long> {

  List<UrlValidationEvent> findByApprovalStatusOrderByCreatedAtDesc(
    String approvalStatus);

  /**
   * Delete all URL validation events for a specific company.
   *
   * @param companyExtractionDataId the company ID
   */
  void deleteByCompanyExtractionDataId(Long companyExtractionDataId);
}
