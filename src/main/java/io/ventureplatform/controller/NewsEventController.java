package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.NewsEventResponse;
import io.ventureplatform.entity.NewsEvent;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.NewsEventService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for news event operations.
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION
    + "/news-events")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
@Slf4j
public class NewsEventController {

  /**
   * News event service.
   */
  private final NewsEventService newsEventService;

  /**
   * Security service for authorization checks.
   */
  private final io.ventureplatform.service.SecurityService securityService;

  /**
   * Fetch news for a specific company.
   *
   * @param companyId the company ID
   * @param user current user
   * @return response with fetch results
   */
  @PostMapping("/fetch/{companyId}")
  public ResponseEntity<?> fetchCompanyNews(
      @PathVariable final Long companyId,
      @CurrentUser final User user) {
    log.info("=== NEWS FETCH API CALLED ===");
    log.info("User {} requesting news fetch for company ID: {}",
        user.getEmail(), companyId);

    try {
      Map<String, Object> result =
          newsEventService.fetchAndSaveNewsForCompany(companyId);

      log.info("News fetch result: {}", result);
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error fetching news for company {}: {}",
          companyId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of(
              "success", false,
              "message", "Error fetching news: " + e.getMessage(),
              "articlesFound", 0
          ));
    }
  }

  /**
   * Fetch news for ALL tracked companies (manual trigger for bulk scraping).
   * This endpoint bypasses the weekday rotation and scrapes all companies
   * with track_news=true immediately.
   * Restricted to superadmins only due to resource-intensive operation.
   *
   * @param user current user
   * @param limit optional limit on number of companies to process
   *              (for testing, use small number like 2)
   * @return response with bulk scraping results
   */
  @PostMapping("/fetch-all-tracked")
  public ResponseEntity<?> fetchAllTrackedCompaniesNews(
      @CurrentUser final User user,
      @RequestParam(required = false) final Integer limit) {
    log.info("=== BULK NEWS FETCH API CALLED ===");
    log.info("User {} requesting bulk news fetch for all "
        + "tracked companies (limit: {})", user.getEmail(),
        limit != null ? limit : "none");

    // Only superadmins can trigger bulk scraping
    if (!securityService.isSuperAdmin()) {
      log.warn("User {} attempted bulk news fetch without superadmin role",
        user.getEmail());
      return ResponseEntity.status(403)
        .body(Map.of(
          "success", false,
          "message", "Only superadmins can trigger bulk news scraping"
        ));
    }

    try {
      Map<String, Object> result =
          newsEventService.fetchAndSaveNewsForAllTrackedCompanies(limit);

      log.info("Bulk news fetch result: {}", result);
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error in bulk news fetch: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of(
              "success", false,
              "message", "Error fetching news: " + e.getMessage(),
              "companiesProcessed", 0,
              "totalArticlesSaved", 0
          ));
    }
  }

  /**
   * Get news events for a specific company.
   *
   * @param companyId the company ID
   * @param days number of days to look back
   * @return list of news events
   */
  @GetMapping("/company/{companyId}")
  public ResponseEntity<List<NewsEventResponse>> getCompanyNews(
      @PathVariable final Long companyId,
      @RequestParam(defaultValue = "30") final int days) {
    log.info("Fetching news for company {} for last {} days",
        companyId, days);

    List<NewsEvent> events = newsEventService.getCompanyNews(companyId, days);
    List<NewsEventResponse> responses = events.stream()
        .map(this::convertToResponse)
        .collect(Collectors.toList());
    log.info("Returning {} news events", responses.size());

    return ResponseEntity.ok(responses);
  }

  /**
   * Get all news events (sysadmin/superadmin only).
   * Useful for testing and debugging when user access filtering
   * may be causing issues.
   *
   * @param days number of days to look back
   * @param portfolioId optional portfolio ID to filter by
   * @return list of news events
   */
  @GetMapping("/all")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<List<NewsEventResponse>> getAllNews(
      @RequestParam(defaultValue = "30") final int days,
      @RequestParam(required = false) final Long portfolioId) {
    log.info("Fetching ALL news events for last {} days, portfolioId: {}",
        days, portfolioId);

    List<NewsEvent> events;
    if (portfolioId != null) {
      events = newsEventService.getNewsForPortfolio(portfolioId, days);
    } else {
      events = newsEventService.getAllRecentNews(days);
    }

    List<NewsEventResponse> responses = events.stream()
        .map(this::convertToResponse)
        .collect(Collectors.toList());

    log.info("Returning {} news events (sysadmin)", responses.size());
    return ResponseEntity.ok(responses);
  }

  /**
   * Get news events for current user (filtered by portfolio access).
   *
   * @param user current user
   * @param days number of days to look back
   * @param portfolioId optional portfolio ID to filter by
   * @return list of news events
   */
  @GetMapping("/user")
  public ResponseEntity<List<NewsEventResponse>> getUserNews(
      @CurrentUser final User user,
      @RequestParam(defaultValue = "30") final int days,
      @RequestParam(required = false) final Long portfolioId) {
    log.info("Fetching news events for user: {} (id: {}, org: {}) "
        + "for last {} days, portfolioId: {}",
        user.getEmail(), user.getId(),
        user.getOrganization() != null
            ? user.getOrganization().getId() : "none",
        days, portfolioId);

    List<NewsEvent> events = newsEventService.getNewsForUser(
        user, days, portfolioId);

    List<NewsEventResponse> responses = events.stream()
        .map(this::convertToResponse)
        .collect(Collectors.toList());

    log.info("Returning {} news events for user {}",
        responses.size(), user.getEmail());
    return ResponseEntity.ok(responses);
  }

  /**
   * Convert NewsEvent entity to response DTO.
   *
   * @param event the news event entity
   * @return the response DTO
   */
  private NewsEventResponse convertToResponse(final NewsEvent event) {
    return NewsEventResponse.builder()
        .id(event.getId())
        .companyExtractionData(
            NewsEventResponse.CompanyInfo.builder()
                .id(event.getCompanyExtractionData().getId())
                .companyName(event.getCompanyExtractionData().getCompanyName())
                .build())
        .title(event.getTitle())
        .source(event.getSource())
        .sourceUrl(event.getSourceUrl())
        .publishedDate(event.getPublishedDate())
        .summary(event.getSummary())
        .sourceType(event.getSourceType())
        .createdAt(event.getCreatedAt())
        .build();
  }
}
