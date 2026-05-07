package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.UrlValidationEventResponse;
import io.ventureplatform.entity.UrlValidationEvent;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.UrlValidationEventService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for URL validation events and approvals.
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION
  + "/url-validation-events")
@RequiredArgsConstructor
@Slf4j
public class UrlValidationEventController {

  private final UrlValidationEventService eventService;

  @GetMapping("/pending")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<List<UrlValidationEventResponse>> getPendingEvents() {
    log.info("Fetching pending URL validation events");
    List<UrlValidationEvent> events = eventService.getPendingEvents();
    List<UrlValidationEventResponse> response = events.stream()
      .map(this::mapToResponse)
      .collect(Collectors.toList());
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/approve")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<UrlValidationEventResponse> approveUrlChange(
    @PathVariable final Long id,
    @CurrentUser final User user) {
    log.info("Approving URL validation event: {}", id);
    UrlValidationEvent event = eventService.approveUrlChange(id, user);
    return ResponseEntity.ok(mapToResponse(event));
  }

  @PostMapping("/{id}/reject")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<UrlValidationEventResponse> rejectUrlChange(
    @PathVariable final Long id,
    @CurrentUser final User user) {
    log.info("Rejecting URL validation event: {}", id);
    UrlValidationEvent event = eventService.rejectUrlChange(id, user);
    return ResponseEntity.ok(mapToResponse(event));
  }

  @PutMapping("/{id}/update-url")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<UrlValidationEventResponse> updateEventUrl(
    @PathVariable final Long id,
    @RequestBody final Map<String, String> request) {
    String newUrl = request.get("newUrl");
    log.info("Updating URL for event {}: {}", id, newUrl);
    UrlValidationEvent event = eventService.updateEventUrl(id, newUrl);
    return ResponseEntity.ok(mapToResponse(event));
  }

  private UrlValidationEventResponse mapToResponse(
    final UrlValidationEvent event) {
    UrlValidationEventResponse response = new UrlValidationEventResponse();
    response.setId(event.getId());
    response.setEventType(event.getEventType());
    response.setOldUrl(event.getOldUrl());
    response.setNewUrl(event.getNewUrl());
    response.setStatusCode(event.getStatusCode());
    response.setErrorMessage(event.getErrorMessage());
    response.setApprovalStatus(event.getApprovalStatus());
    response.setCreatedAt(event.getCreatedAt());
    response.setReviewedAt(event.getReviewedAt());

    if (event.getCompanyExtractionData() != null) {
      UrlValidationEventResponse.CompanyInfo companyInfo =
        new UrlValidationEventResponse.CompanyInfo();
      companyInfo.setId(event.getCompanyExtractionData().getId());
      companyInfo.setCompanyName(
        event.getCompanyExtractionData().getCompanyName()
      );
      companyInfo.setCompanyUrl(
        event.getCompanyExtractionData().getCompanyUrl()
      );
      response.setCompanyExtractionData(companyInfo);
    }

    if (event.getReviewedBy() != null) {
      UrlValidationEventResponse.ReviewerInfo reviewerInfo =
        new UrlValidationEventResponse.ReviewerInfo();
      reviewerInfo.setId(event.getReviewedBy().getId());
      reviewerInfo.setFirstName(event.getReviewedBy().getName());
      reviewerInfo.setLastName(event.getReviewedBy().getLastName());
      reviewerInfo.setEmail(event.getReviewedBy().getEmail());
      response.setReviewedBy(reviewerInfo);
    }

    return response;
  }
}
