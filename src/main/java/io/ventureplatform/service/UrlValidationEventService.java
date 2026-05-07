package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.PortfolioCompanyExtractionAccess;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.UrlValidationEvent;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.PortfolioCompanyExtractionAccessRepository;
import io.ventureplatform.repository.UrlValidationEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing URL validation events and approvals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UrlValidationEventService {

  private final UrlValidationEventRepository eventRepository;
  private final CompanyExtractionDataRepository companyRepository;
  private final PortfolioCompanyExtractionAccessRepository accessRepository;

  public List<UrlValidationEvent> getPendingEvents() {
    return eventRepository.findByApprovalStatusOrderByCreatedAtDesc(
      "PENDING_APPROVAL"
    );
  }

  @Transactional
  public UrlValidationEvent approveUrlChange(final Long eventId,
    final User reviewer) {
    UrlValidationEvent event = eventRepository.findById(eventId)
      .orElseThrow(() ->
        new IllegalArgumentException("Event not found: " + eventId));

    if (!"PENDING_APPROVAL".equals(event.getApprovalStatus())) {
      throw new IllegalStateException(
        "Event is not pending approval: " + event.getApprovalStatus()
      );
    }

    if (event.getNewUrl() == null || event.getNewUrl().trim().isEmpty()) {
      throw new IllegalStateException(
        "Cannot approve event without a valid new URL"
      );
    }

    log.info("Approving URL change for company {}: {} -> {}",
      event.getCompanyExtractionData().getCompanyName(),
      event.getOldUrl(),
      event.getNewUrl());

    CompanyExtractionData company = event.getCompanyExtractionData();
    company.setCompanyUrl(event.getNewUrl());
    companyRepository.save(company);

    event.setApprovalStatus("APPROVED");
    event.setReviewedBy(reviewer);
    event.setReviewedAt(new Date());
    eventRepository.save(event);

    createNotificationsForAffectedUsers(event);

    return event;
  }

  @Transactional
  public UrlValidationEvent rejectUrlChange(final Long eventId,
    final User reviewer) {
    UrlValidationEvent event = eventRepository.findById(eventId)
      .orElseThrow(() ->
        new IllegalArgumentException("Event not found: " + eventId));

    if (!"PENDING_APPROVAL".equals(event.getApprovalStatus())) {
      throw new IllegalStateException(
        "Event is not pending approval: " + event.getApprovalStatus()
      );
    }

    log.info("Rejecting URL change for company {}: {} -> {}",
      event.getCompanyExtractionData().getCompanyName(),
      event.getOldUrl(),
      event.getNewUrl());

    event.setApprovalStatus("REJECTED");
    event.setReviewedBy(reviewer);
    event.setReviewedAt(new Date());
    eventRepository.save(event);

    return event;
  }

  @Transactional
  public UrlValidationEvent updateEventUrl(final Long eventId,
    final String newUrl) {
    UrlValidationEvent event = eventRepository.findById(eventId)
      .orElseThrow(() ->
        new IllegalArgumentException("Event not found: " + eventId));

    if (!"PENDING_APPROVAL".equals(event.getApprovalStatus())) {
      throw new IllegalStateException(
        "Can only update URL for pending events: "
          + event.getApprovalStatus()
      );
    }

    log.info("Updating event {} URL from {} to {}",
      eventId, event.getNewUrl(), newUrl);

    event.setNewUrl(newUrl);
    eventRepository.save(event);

    return event;
  }

  private void createNotificationsForAffectedUsers(
    final UrlValidationEvent event) {
    CompanyExtractionData company = event.getCompanyExtractionData();

    List<PortfolioCompanyExtractionAccess> accessList =
      accessRepository.findByCompanyExtractionDataId(company.getId());

    List<Long> portfolioIds = accessList.stream()
      .map(access -> access.getPortfolio().getId())
      .distinct()
      .collect(Collectors.toList());

    log.info("Creating notifications for {} portfolios that have company: {}",
      portfolioIds.size(), company.getCompanyName());

    for (int i = 0; i < portfolioIds.size(); i++) {
      UrlValidationEvent notification = new UrlValidationEvent();
      notification.setCompanyExtractionData(company);
      notification.setEventType("URL_UPDATED");
      notification.setOldUrl(event.getOldUrl());
      notification.setNewUrl(event.getNewUrl());
      notification.setErrorMessage(event.getErrorMessage());
      notification.setApprovalStatus("APPROVED");
      eventRepository.save(notification);
    }

    log.info("Created {} notification events", portfolioIds.size());
  }
}
