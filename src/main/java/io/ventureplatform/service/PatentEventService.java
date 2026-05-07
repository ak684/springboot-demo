package io.ventureplatform.service;

import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.entity.PatentEvent;
import io.ventureplatform.entity.User;
import io.ventureplatform.repository.PatentEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * Service for managing patent events and notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatentEventService {

  /**
   * Organization ID to use when user has no organization.
   */
  private static final long NO_ORGANIZATION_ID = -1L;

  /**
   * Repository for patent event persistence.
   */
  private final PatentEventRepository patentEventRepository;

  /**
   * Service for security and authorization.
   */
  private final SecurityService securityService;

  /**
   * Create a new patent event.
   *
   * @param company the company associated with the event
   * @param patent the patent associated with the event
   * @param eventType the type of event (e.g., NEW_PATENT, STATUS_CHANGE)
   * @param oldValue the previous value (if applicable)
   * @param newValue the new value (if applicable)
   * @return the saved patent event
   */
  @Transactional
  public PatentEvent createEvent(final CompanyExtractionData company,
                                 final CompanyPatent patent,
                                 final String eventType,
                                 final String oldValue,
                                 final String newValue) {
    PatentEvent event = new PatentEvent()
        .setCompanyExtractionData(company)
        .setCompanyPatent(patent)
        .setEventType(eventType)
        .setOldValue(oldValue)
        .setNewValue(newValue);

    PatentEvent saved = patentEventRepository.save(event);
    log.info("Created patent event: {} for company {}",
        eventType, company.getCompanyName());
    return saved;
  }

  /**
   * Simple version for events without old/new values.
   *
   * @param company the company associated with the event
   * @param patent the patent associated with the event
   * @param eventType the type of event
   * @return the saved patent event
   */
  @Transactional
  public PatentEvent createEvent(final CompanyExtractionData company,
                                 final CompanyPatent patent,
                                 final String eventType) {
    return createEvent(company, patent, eventType, null, null);
  }

  /**
   * Generate human-readable description from event type and values.
   *
   * @param event the patent event
   * @return human-readable description of the event
   */
  public String generateDescription(final PatentEvent event) {
    String patentNumber = event.getCompanyPatent() != null
        ? event.getCompanyPatent().getPatentNumber() : "";

    switch (event.getEventType()) {
      case "NEW_PATENT":
        return String.format("New patent found: %s", patentNumber);

      case "PATENT_COUNT_CHANGE":
        int oldCount = Integer.parseInt(event.getOldValue());
        int newCount = Integer.parseInt(event.getNewValue());
        int increase = newCount - oldCount;
        return String.format("Patent count increased by %d (from %s to %s)",
            increase, event.getOldValue(), event.getNewValue());

      case "CITED_BY_CHANGE":
        return String.format(
            "Patent %s cited by count changed from %s to %s",
            patentNumber, event.getOldValue(), event.getNewValue());

      case "STATUS_CHANGE":
        return String.format("Patent %s status changed from %s to %s",
            patentNumber, event.getOldValue(), event.getNewValue());

      default:
        return String.format("Patent event: %s", event.getEventType());
    }
  }

  /**
   * Get patent events for companies the user has access to.
   * If portfolioId is provided, filters to only that portfolio.
   * Otherwise shows events for companies the user has access to through
   * their portfolios or organization.
   *
   * @param user the current user
   * @param days number of days to look back
   * @param portfolioId optional portfolio ID to filter by
   * @return list of patent events accessible to the user
   */
  public List<PatentEvent> getEventsForUser(
      final User user,
      final int days,
      final Long portfolioId) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    // If portfolioId specified, verify access then filter to that portfolio
    if (portfolioId != null) {
      if (!securityService.isSuperAdmin()
          && !securityService.isPortfolioMember(null, portfolioId)) {
        log.warn("User {} requested patent events for portfolioId {} they"
            + " don't have access to", user.getEmail(), portfolioId);
        return Collections.emptyList();
      }
      log.info("Fetching patent events for portfolioId: {} since: {}",
          portfolioId, since);
      List<PatentEvent> events = patentEventRepository
          .findEventsForPortfolioSince(portfolioId, since);
      log.info("Found {} patent events for portfolio {}",
          events.size(), portfolioId);
      return events;
    }

    // If superadmin and no portfolioId, see all events
    if (securityService.isSuperAdmin()) {
      log.info("Superadmin {} requesting all patent events since: {}",
          user.getEmail(), since);
      List<PatentEvent> events = patentEventRepository
          .findByCreatedAtAfterOrderByCreatedAtDesc(since);
      log.info("Found {} total patent events for superadmin",
          events.size());
      return events;
    }

    // Regular users see events for companies they have access to
    Long organizationId = user.getOrganization() != null
        ? user.getOrganization().getId()
        : NO_ORGANIZATION_ID;

    log.info("Querying patent events for userId: {}, orgId: {}, since: {}",
        user.getId(), organizationId, since);

    List<PatentEvent> events = patentEventRepository.findEventsForUserSince(
        user.getId(), organizationId, since);

    log.info("Found {} patent events for user {}",
        events.size(), user.getEmail());

    return events;
  }

  /**
   * Get all recent events (for super admin).
   */
  public List<PatentEvent> getRecentEvents(final int days) {
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DAY_OF_YEAR, -days);
    Date since = cal.getTime();

    return patentEventRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since);
  }

  /**
   * Get events for a specific company.
   *
   * @param companyId the company ID
   * @return list of patent events for the company
   */
  public List<PatentEvent> getCompanyEvents(final Long companyId) {
    return patentEventRepository
        .findByCompanyExtractionDataIdOrderByCreatedAtDesc(companyId);
  }
}
