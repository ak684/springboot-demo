package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.PatentEventResponse;
import io.ventureplatform.entity.PatentEvent;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.PatentEventService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION
        + "/patent-events")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
@Slf4j
public class PatentEventController {

  /**
   * Patent event service.
   */
  private final PatentEventService patentEventService;

  /**
   * Get patent events for current user.
   *
   * @param user current user
   * @param days number of days to look back
   * @param portfolioId optional portfolio ID to filter by
   * @return list of patent events
   */
  @GetMapping("/user")
  public ResponseEntity<List<PatentEventResponse>> getUserPatentEvents(
          @CurrentUser final User user,
          @RequestParam(defaultValue = "30") final int days,
          @RequestParam(required = false) final Long portfolioId) {
    log.info("Fetching patent events for user: {} (id: {}, org: {}) "
            + "for last {} days, portfolioId: {}",
            user.getEmail(), user.getId(),
            user.getOrganization() != null
                ? user.getOrganization().getId() : "none",
            days, portfolioId);

    List<PatentEvent> events = patentEventService
            .getEventsForUser(user, days, portfolioId);

    List<PatentEventResponse> responses = events.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());

    log.info("Returning {} patent events for user {}",
        responses.size(), user.getEmail());
    return ResponseEntity.ok(responses);
  }

  /**
   * Get patent events for a specific company.
   *
   * @param companyId company ID
   * @param user current user
   * @return list of patent events
   */
  @GetMapping("/company/{companyId}")
  public ResponseEntity<List<PatentEventResponse>> getCompanyPatentEvents(
          @PathVariable final Long companyId,
          @CurrentUser final User user) {
    log.info("Fetching patent events for company: {} by user: {}",
            companyId, user.getEmail());

    List<PatentEvent> events = patentEventService
            .getCompanyEvents(companyId);

    List<PatentEventResponse> responses = events.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());

    return ResponseEntity.ok(responses);
  }

  private PatentEventResponse convertToResponse(final PatentEvent event) {
    PatentEventResponse.PatentInfo patentInfo = null;
    if (event.getCompanyPatent() != null) {

      patentInfo = PatentEventResponse.PatentInfo.builder()
              .id(event.getCompanyPatent().getId())
              .patentNumber(event.getCompanyPatent().getPatentNumber())
              .title(event.getCompanyPatent().getTitle())
              .patentJurisdictions(
                  event.getCompanyPatent().getPatentJurisdictions())
              .patentStatus(event.getCompanyPatent().getPatentStatus())
              .build();
    }

    return PatentEventResponse.builder()
            .id(event.getId())
            .companyExtractionData(
                    PatentEventResponse.CompanyInfo.builder()
                    .id(event.getCompanyExtractionData().getId())
                    .companyName(event.getCompanyExtractionData()
                            .getCompanyName())
                    .build())
            .companyPatent(patentInfo)
            .eventType(event.getEventType())
            .oldValue(event.getOldValue())
            .newValue(event.getNewValue())
            .createdAt(event.getCreatedAt())
            .description(patentEventService
                    .generateDescription(event))
            .build();
  }

}
