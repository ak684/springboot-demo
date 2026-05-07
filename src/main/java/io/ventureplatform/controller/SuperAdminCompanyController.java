package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.UpdatePublicProfileRequest;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.service.CompanyDataExtractionService;
import io.ventureplatform.service.CompanyExtractionDataService;
import io.ventureplatform.service.CompanyDataExtractionMetricsCacheService;
import io.ventureplatform.service.ContactDataBackfillService;
import io.ventureplatform.service.GeographySummaryBackfillService;
import io.ventureplatform.service.GeocodingService;
import io.ventureplatform.service.extraction.phases.CarbonEmissionsService;
import io.ventureplatform.service.extraction.phases.CoreProductsServicesExtractionService;
import io.ventureplatform.service.extraction.phases.EsgRiskScoreService;
import io.ventureplatform.service.extraction.phases.SustainabilityBusinessModelOrientationService;
import io.ventureplatform.service.extraction.phases.EsgForesightScoreService;
import io.ventureplatform.service.extraction.phases.EsgMaterialityService;
import io.ventureplatform.service.extraction.phases.TheoryOfChangeService;
import io.ventureplatform.service.extraction.phases.GrowthLikelihoodService;
import io.ventureplatform.service.extraction.phases.FintechClassificationService;
import io.ventureplatform.service.WebsiteTrafficImportService;
import io.ventureplatform.service.PatentCounterService;
import io.ventureplatform.service.PatentDetailService;
import io.ventureplatform.service.PatentEventService;
import io.ventureplatform.service.SecurityService;
import io.ventureplatform.service.translation.PublicProfileLanguage;
import io.ventureplatform.service.translation.PublicProfileTranslationService;
import io.ventureplatform.service.UrlValidationService;
import io.ventureplatform.service.CompanyPolarChartService;
import io.ventureplatform.service.CompanyPortfolioNarrativeService;
import io.ventureplatform.service.CompanyNoteService;
import io.ventureplatform.dto.response.PatentCountModel;
import io.ventureplatform.entity.PatentEvent;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import javax.validation.Valid;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/companies")
@RequiredArgsConstructor
@Slf4j
public class SuperAdminCompanyController {

  private final CompanyDataExtractionService companyDataExtractionService;
  private final CompanyExtractionDataService companyExtractionDataService;
  private final ContactDataBackfillService contactDataBackfillService;
  private final GeographySummaryBackfillService geographySummaryBackfillService;
  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  private final CompanyPatentRepository companyPatentRepository;
  private final CompanyDataExtractionMetricsCacheService metricsCacheService;
  private final GeocodingService geocodingService;
  private final CarbonEmissionsService carbonEmissionsService;
  private final CoreProductsServicesExtractionService coreProductsServicesExtractionService;
  private final EsgRiskScoreService esgRiskScoreService;
  private final SustainabilityBusinessModelOrientationService sustainabilityBusinessModelOrientationService;
  private final EsgForesightScoreService esgForesightScoreService;
  private final EsgMaterialityService esgMaterialityService;
  private final TheoryOfChangeService theoryOfChangeService;
  private final GrowthLikelihoodService growthLikelihoodService;
  private final FintechClassificationService fintechClassificationService;
  private final WebsiteTrafficImportService websiteTrafficImportService;
  private final PatentCounterService patentCounterService;
  private final PatentDetailService patentDetailService;
  private final PatentEventService patentEventService;
  private final SecurityService securityService;
  private final CompanyPolarChartService companyPolarChartService;
  private final CompanyPortfolioNarrativeService companyPortfolioNarrativeService;
  private final ObjectMapper objectMapper;
  private final UrlValidationService urlValidationService;
  private final CompanyNoteService companyNoteService;
  private final PublicProfileTranslationService publicProfileTranslationService;
  private static final int RERUN_BATCH_SIZE = 45;
  private static final int PARALLEL_PROCESSING_THREADS = 15;

  @PostMapping
  @PreAuthorize("isSuperAdmin() or (#request['portfolioId'] != null and isPortfolioMember(null, #request['portfolioId']))")
  public ResponseEntity<String> extractCompanyData(@RequestBody Map<String, Object> request) {
    try {
      String companyUrl = (String) request.get("url");
      Long portfolioId = request.get("portfolioId") != null ? 
          Long.valueOf(request.get("portfolioId").toString()) : null;
      
      if (companyUrl == null || companyUrl.trim().isEmpty()) {
        return ResponseEntity.badRequest().body("{\"error\": \"Company URL is required\"}");
      }
      
      log.info("Starting company data extraction for URL: {}, portfolio: {}", companyUrl, portfolioId);

      // Delegate to service which handles all orchestration
      String result = companyDataExtractionService.extractCompanyData(companyUrl, portfolioId);

      // Invalidate metrics cache since we added/updated a company
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after company extraction");

      log.info("Company data extraction completed successfully");
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error extracting company data", e);
      return ResponseEntity.ok("{\"error\": \"Failed to extract company data: " + e.getMessage() + "\"}");
    }
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
    try {
      log.info("Deleting company extraction data for ID: {}", id);
      companyExtractionDataService.deleteById(id);

      // Invalidate metrics cache since we deleted a company
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after company deletion");

      log.info("Successfully deleted company with ID: {}", id);
      return ResponseEntity.ok().build();
    } catch (IllegalArgumentException e) {
      log.warn("Company not found for deletion with ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error deleting company with ID: {}", id, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @DeleteMapping("/{id}/portfolio/{portfolioId}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Void> removeCompanyFromPortfolio(
      @PathVariable Long id,
      @PathVariable Long portfolioId) {
    try {
      log.info("Removing company {} from portfolio {}", id, portfolioId);
      companyExtractionDataService.removeFromPortfolio(id, portfolioId);

      // Invalidate metrics cache since we removed a company from portfolio
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after removing company from portfolio");

      log.info("Successfully removed company {} from portfolio {}", id, portfolioId);
      return ResponseEntity.ok().build();
    } catch (IllegalArgumentException e) {
      log.warn("Company not found for removal: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error removing company {} from portfolio {}: {}", id, portfolioId, e.getMessage());
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Endpoint for portfolio members to remove companies from their own portfolios.
   * Unlike the superadmin endpoint, this requires portfolio membership verification.
   * Supports access via: superadmin, organization membership, or direct portfolio membership.
   */
  @DeleteMapping("/portfolio/{portfolioId}/company/{companyId}")
  @PreAuthorize("isSuperAdmin() or isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<Void> removeCompanyFromPortfolioByMember(
      @PathVariable(name = "portfolioId") Portfolio portfolio,
      @PathVariable Long companyId) {
    try {
      log.info("Portfolio member removing company {} from portfolio {}", companyId, portfolio.getId());
      companyExtractionDataService.removeFromPortfolio(companyId, portfolio.getId());

      // Invalidate metrics cache since we removed a company from portfolio
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after portfolio member removed company from portfolio");

      log.info("Successfully removed company {} from portfolio {} by portfolio member", companyId, portfolio.getId());
      return ResponseEntity.ok().build();
    } catch (IllegalArgumentException e) {
      log.warn("Company not found for removal: {}", companyId);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error removing company {} from portfolio {} by member: {}", companyId, portfolio.getId(), e.getMessage());
      return ResponseEntity.internalServerError().build();
    }
  }

  @PutMapping("/{id}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> updateCompanyData(
      @PathVariable Long id,
      @RequestBody Map<String, Object> updates) {
    try {
      log.info("Updating company extraction data for ID: {} with {} fields", id, updates.size());

      Map<String, Object> response = companyExtractionDataService.updateCompanyData(id, updates);

      // Invalidate metrics cache since we updated a company
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after company update");

      log.info("Successfully updated company data for ID: {}", id);
      return ResponseEntity.ok(response);

    } catch (IllegalArgumentException e) {
      log.warn("Company not found for update with ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error updating company with ID: {}", id, e);
      return ResponseEntity.badRequest().body(
          Map.of("error", e.getMessage())
      );
    }
  }

  /**
   * Check if the current user can edit a company's
   * public profile. Returns 200 if allowed, 403 if not.
   *
   * @param id company extraction data ID
   * @return empty 200 response if access is granted
   */
  @GetMapping("/{id}/public-profile-access")
  @PreAuthorize("canEditCompanyPublicProfile(#id)")
  public ResponseEntity<Void> checkPublicProfileAccess(
      @PathVariable final Long id) {
    return ResponseEntity.ok().build();
  }

  /**
   * Update public profile fields for a company.
   * Available to any user with portfolio access to
   * the company, not just superadmins.
   *
   * @param id company extraction data ID
   * @param request fields to update
   * @return updated public profile
   */
  @PatchMapping("/{id}/public-profile")
  @PreAuthorize("canEditCompanyPublicProfile(#id)")
  public ResponseEntity<Map<String, Object>>
      updatePublicProfile(
      @PathVariable final Long id,
      @Valid @RequestBody
      final UpdatePublicProfileRequest request) {
    try {
      log.info("Updating public profile for company"
          + " ID: {}", id);
      Map<String, Object> response =
          companyExtractionDataService
              .updatePublicProfile(id, request);
      metricsCacheService.invalidateCache();
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      log.warn("Company not found for public profile"
          + " update, ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error updating public profile for"
          + " company ID: {}", id, e);
      return ResponseEntity.badRequest().body(
          Map.of("error", e.getMessage()));
    }
  }

  /**
   * Manual "Translate from " button. Synchronously translates
   * the public profile description from the supplied source
   * language into the other language and returns the updated
   * profile. Acts as a 1-click recovery from silent failures
   * of the after-commit auto-translation pipeline (#518).
   *
   * @param id          company extraction data ID
   * @param sourceLang  language to translate FROM ("en"/"de")
   * @return updated public profile (in the target language)
   *         on success, or 4xx with an error body otherwise
   */
  @PostMapping("/{id}/public-profile/translate")
  @PreAuthorize("canEditCompanyPublicProfile(#id)")
  public ResponseEntity<Map<String, Object>>
      translatePublicProfile(
      @PathVariable final Long id,
      @RequestParam("from") final String sourceLang) {
    try {
      PublicProfileLanguage parsed;
      try {
        parsed = PublicProfileLanguage.parse(sourceLang);
      } catch (IllegalArgumentException badLang) {
        return ResponseEntity.badRequest().body(
            Map.of("error",
                "Unsupported language: " + sourceLang));
      }
      log.info(
          "Manual translate requested for company {} from {}",
          id, parsed.getCode());
      boolean translated = publicProfileTranslationService
          .translateNow(id, parsed);
      if (!translated) {
        return ResponseEntity.badRequest().body(
            Map.of("error",
                "Translation could not be completed."
                    + " Source description may be empty"
                    + " or the company was not found."));
      }
      // Return the freshly translated target-language view so
      // the frontend can drop the "Translating…" spinner and
      // populate the inactive tab in one round trip.
      Map<String, Object> updated = companyExtractionDataService
          .getPublicCompanyProfile(id, null,
              parsed.other(), false);
      return ResponseEntity.ok(updated);
    } catch (Exception e) {
      log.error(
          "Error during manual translate for company {}: {}",
          id, e.getMessage(), e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Translation failed"));
    }
  }

  /**
   * Check if current user is a superadmin.
   * Used by frontend to conditionally show/hide edit functionality.
   */
  @GetMapping("/is-superadmin")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, Object>> checkSuperAdminStatus(@CurrentUser User user) {
    boolean isSuperAdmin = securityService.isSuperAdmin();
    return ResponseEntity.ok(Map.of(
      "isSuperAdmin", isSuperAdmin
    ));
  }

  @GetMapping("/tags")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<String>> getAllTags(@CurrentUser User user) {
    try {
      // Get tags only from companies the user has access to
      List<String> tags = companyExtractionDataService.getUniqueTagsForUser(user);
      return ResponseEntity.ok(tags);
    } catch (Exception e) {
      log.error("Error getting tags for user: {}", user.getEmail(), e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/profile/{id}")
  @PreAuthorize("canAccessCompany(#id)")
  public ResponseEntity<Map<String, Object>> getCompanyProfile(@PathVariable Long id,
                                                               @RequestParam(required = false)
                                                               Long portfolioId) {
    long controllerStartTime = System.currentTimeMillis();
    try {
      log.info("===== CONTROLLER: PROFILE ENDPOINT REQUEST =====");
      log.info("Fetching company profile for ID: {}", id);

      long serviceStartTime = System.currentTimeMillis();
      Map<String, Object> profile = companyExtractionDataService.getCompanyProfile(id, portfolioId);
      long serviceTime = System.currentTimeMillis() - serviceStartTime;

      log.info("*** CONTROLLER: SERVICE CALL TOOK {} ms ***", serviceTime);

      long totalTime = System.currentTimeMillis() - controllerStartTime;
      log.info("*** CONTROLLER: TOTAL REQUEST TIME {} ms ***", totalTime);

      return ResponseEntity.ok(profile);

    } catch (IllegalArgumentException e) {
      log.warn("Company not found with ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error fetching company profile for ID: {}", id, e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to fetch company profile: " + e.getMessage())
      );
    }
  }

  @GetMapping("/profile/{id}/polar-area")
  @PreAuthorize("canAccessCompany(#id)")
  public ResponseEntity<?> getCompanyProfilePolarArea(
      @PathVariable Long id,
      @RequestParam(required = false) Long portfolioId,
      @CurrentUser User user) {
    try {
      CompanyPolarChartService.PolarChartResponse polarChartResponse =
          companyPolarChartService.getPolarChart(id);
      CompanyExtractionDataService.PortfolioRankDetails rankDetails =
          companyExtractionDataService.getPortfolioRankDetails(id, portfolioId);
      polarChartResponse.setPortfolioRank(rankDetails.getPortfolioRank());
      polarChartResponse.setRankedCompanyCount(rankDetails.getRankedCompanyCount());
      CompanyPortfolioNarrativeService.NarrativeTexts narrative =
          companyPortfolioNarrativeService.getOrGenerateNarrative(id, polarChartResponse);
      if (narrative != null) {
        polarChartResponse.setPortfolioStrengthsText(narrative.getStrengths());
        polarChartResponse.setPortfolioWeaknessesText(narrative.getWeaknesses());
        polarChartResponse.setPortfolioImpactText(narrative.getImpact());
        polarChartResponse.setPortfolioPotentialNeedsText(narrative.getPotentialNeeds());
        polarChartResponse.setPortfolioNarrativeGeneratedAt(narrative.getGeneratedAt());
      }
      return ResponseEntity.ok(polarChartResponse);
    } catch (IllegalArgumentException e) {
      log.warn("Company not found for polar-area chart with ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error building polar-area chart for company {}: {}", id, e.getMessage(), e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to build polar-area chart: " + e.getMessage())
      );
    }
  }

  /**
   * Get full text for a specific field of a company (for smart tooltips).
   * Ultra-fast endpoint that fetches only the requested field.
   *
   * @param id Company ID
   * @param fieldName Field name to fetch full text for
   * @return Full text content
   */
  @GetMapping("/full-text/{id}/{fieldName}")
  @PreAuthorize("canAccessCompany(#id)")
  public ResponseEntity<Map<String, Object>> getFullText(@PathVariable Long id, @PathVariable String fieldName) {
    long controllerStartTime = System.currentTimeMillis();
    try {
      log.info("===== CONTROLLER: FULL-TEXT ENDPOINT REQUEST =====");
      log.info("Fetching full text for company ID: {}, field: {}", id, fieldName);

      long serviceCallStart = System.currentTimeMillis();
      String fullText = companyExtractionDataService.getFullTextForField(id, fieldName);
      long serviceCallTime = System.currentTimeMillis() - serviceCallStart;

      log.info("*** CONTROLLER: FULL-TEXT SERVICE CALL TOOK {} ms ***", serviceCallTime);

      long totalTime = System.currentTimeMillis() - controllerStartTime;
      log.info("*** CONTROLLER: FULL-TEXT TOTAL REQUEST TIME {} ms ***", totalTime);

      Map<String, Object> response = Map.of(
          "companyId", id,
          "fieldName", fieldName,
          "fullText", fullText != null ? fullText : ""
      );

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error fetching full text for company ID {} field {}: {}", id, fieldName, e.getMessage(), e);
      return ResponseEntity.status(500)
          .body(Map.of("error", "Failed to fetch full text: " + e.getMessage()));
    }
  }
  
  @GetMapping
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<Map<String, Object>> getAllCompanies(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(required = false) String search) {
    try {
      log.info("Fetching companies - page: {}, size: {}, search: '{}'", page, size, search);

      Map<String, Object> response;
      if (search != null && !search.trim().isEmpty()) {
        response = companyExtractionDataService.searchCompaniesByName(search.trim(), page, size);
      } else {
        response = companyExtractionDataService.getAllCompaniesForDisplay(page, size);
      }

      log.info("Returning page {} with {} companies out of {} total",
               page,
               ((List<?>) response.get("content")).size(),
               response.get("totalElements"));
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error getting companies", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/lite")
  @PreAuthorize("isSysAdminOrSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<Map<String, Object>> getAllCompaniesLite(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Long portfolioId,
      @RequestParam(required = false) String fields) {
    long controllerStartTime = System.currentTimeMillis();
    try {
      // Validate portfolio exists if portfolioId is provided
      if (portfolioId != null && !securityService.portfolioExists(portfolioId)) {
        log.error("Portfolio {} does not exist", portfolioId);
        return ResponseEntity.notFound().build();
      }

      // Parse comma-separated fields into a Set
      Set<String> fieldSet = null;
      if (fields != null && !fields.trim().isEmpty()) {
        fieldSet = Arrays.stream(fields.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
      }

      log.info("===== CONTROLLER: LITE ENDPOINT REQUEST =====");
      log.info("Fetching companies lite - page: {}, size: {}, search: '{}', "
               + "portfolioId: {}, fields: {}",
               page, size, search, portfolioId,
               fieldSet != null ? fieldSet.size() : "all");

      long serviceCallStart = System.currentTimeMillis();
      Map<String, Object> response = companyExtractionDataService
          .getAllCompaniesLite(page, size, search, portfolioId, fieldSet);
      long serviceCallTime = System.currentTimeMillis() - serviceCallStart;

      long controllerTotalTime = System.currentTimeMillis() - controllerStartTime;
      log.info("*** CONTROLLER: SERVICE CALL TOOK {} ms ***", serviceCallTime);
      log.info("*** CONTROLLER: TOTAL REQUEST TIME {} ms ***", controllerTotalTime);
      log.info("Returning lite page {} with {} companies out of {} total",
               page,
               ((List<?>) response.get("content")).size(),
               response.get("totalElements"));
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      long errorTime = System.currentTimeMillis() - controllerStartTime;
      log.error("Error getting companies lite after {} ms", errorTime, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/totals")
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<Map<String, Object>> getPortfolioTotals(
      @RequestParam(required = false) Long portfolioId,
      @RequestParam(required = false) List<String> tags) {
    try {
      log.info("Retrieving portfolio totals for portfolioId: {}, tags: {}", portfolioId, tags);

      // Validate portfolio exists if portfolioId is provided
      if (portfolioId != null && !securityService.portfolioExists(portfolioId)) {
        log.error("Portfolio {} does not exist", portfolioId);
        return ResponseEntity.notFound().build();
      }

      Map<String, Object> totals;

      // If tags are specified, calculate on-the-fly (can't use cache for dynamic tag filtering)
      if (tags != null && !tags.isEmpty()) {
        totals = companyExtractionDataService.calculateTotalsWithTags(portfolioId, tags);
      } else {
        // Use cached metrics for both portfolio-specific and global views
        totals = metricsCacheService.getCachedPortfolioTotals(portfolioId);
      }

      totals = companyExtractionDataService.addContinuousCounterMetadata(totals);

      log.info("Portfolio totals retrieved successfully: {} companies", totals.get("totalCompanies"));
      log.info("Portfolio totals: {} companies, {} employees, {} patents",
          totals.get("totalCompanies"), totals.get("totalEmployees"), totals.get("totalPatents"));
      return ResponseEntity.ok(totals);
    } catch (Exception e) {
      log.error("Error retrieving portfolio totals", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/sbmo-distribution")
  @PreAuthorize(
      "isSuperAdmin() or (#portfolioId != null"
      + " and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<Map<String, Object>>
      getSbmoDistribution(
      @RequestParam(required = false)
      final Long portfolioId,
      @RequestParam(required = false)
      final List<String> tags) {
    try {
      Map<String, Object> distribution =
          companyExtractionDataService
              .calculateSbmoDistribution(
                  portfolioId, tags);
      return ResponseEntity.ok(distribution);
    } catch (Exception e) {
      log.error("Error getting SBMO distribution", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get cluster rankings - companies grouped by technology
   * cluster and ranked by metric.
   * Returns top N companies per cluster sorted by the
   * specified ranking criterion.
   *
   * @param portfolioId optional portfolio filter
   * @param rankBy ranking criterion: portfolio_rank, business_model, growth_likelihood, traffic, custom
   * @param limit number of companies per cluster (default 8)
   * @param metrics comma-separated list of metric IDs for custom ranking (when rankBy=custom)
   * @param tags optional list of tags to filter companies
   * @return Map of cluster names to ranked company lists
   */
  @GetMapping("/cluster-rankings")
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<Map<String, Object>> getClusterRankings(
      @RequestParam(required = false) Long portfolioId,
      @RequestParam(defaultValue = "portfolio_rank") String rankBy,
      @RequestParam(defaultValue = "8") int limit,
      @RequestParam(required = false) List<String> metrics,
      @RequestParam(required = false) List<String> tags) {
    try {
      log.info("Fetching cluster rankings - portfolioId: {}, rankBy: {}, limit: {}, metrics: {}, tags: {}",
          portfolioId, rankBy, limit, metrics, tags);

      // Validate portfolio exists if portfolioId is provided
      if (portfolioId != null && !securityService.portfolioExists(portfolioId)) {
        log.error("Portfolio {} does not exist", portfolioId);
        return ResponseEntity.notFound().build();
      }

      Map<String, Object> rankings = companyExtractionDataService.getClusterRankings(
          portfolioId, rankBy, limit, metrics, tags);
      log.info("Successfully retrieved cluster rankings for {} clusters",
          ((Map<?, ?>) rankings.get("clusters")).size());
      return ResponseEntity.ok(rankings);
    } catch (Exception e) {
      log.error("Error retrieving cluster rankings", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get available metrics for custom cluster rankings.
   * Returns list of metric definitions that can be used to create custom rankings.
   *
   * @return List of available metrics with their metadata
   */
  @GetMapping("/cluster-rankings/available-metrics")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<Map<String, Object>>> getAvailableMetrics() {
    try {
      log.info("Fetching available metrics for custom cluster rankings");
      List<Map<String, Object>> metrics = companyPolarChartService.getAvailableMetrics();
      log.info("Successfully retrieved {} available metrics", metrics.size());
      return ResponseEntity.ok(metrics);
    } catch (Exception e) {
      log.error("Error retrieving available metrics", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/locations")
  @PreAuthorize("isSuperAdmin() or (#portfolioId != null and isPortfolioMember(null, #portfolioId))")
  public ResponseEntity<List<Map<String, Object>>> getAllCompanyLocations(
      @RequestParam(required = false) Long portfolioId) {
    try {
      log.info("Fetching company locations for portfolioId: {}", portfolioId);

      // Validate portfolio exists if portfolioId is provided
      if (portfolioId != null && !securityService.portfolioExists(portfolioId)) {
        log.error("Portfolio {} does not exist", portfolioId);
        return ResponseEntity.notFound().build();
      }
      List<Map<String, Object>> locations = companyExtractionDataService.getAllCompanyLocations(portfolioId);
      log.info("Successfully retrieved {} company locations", locations.size());
      return ResponseEntity.ok(locations);
    } catch (Exception e) {
      log.error("Error getting company locations", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get companies within geographic bounds for map filtering.
   * Returns basic company info for markers on the map.
   * Handles date-line crossing when minLng > maxLng.
   */
  @GetMapping("/companies-in-bounds")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<Map<String, Object>>> getCompaniesInBounds(
      @RequestParam final Double minLat,
      @RequestParam final Double maxLat,
      @RequestParam final Double minLng,
      @RequestParam final Double maxLng,
      @RequestParam(required = false) final Long portfolioId,
      @RequestParam(required = false) final List<String> tags,
      @CurrentUser final User user) {
    try {
      log.info("[GEOLOCATION] Fetching companies in bounds - minLat: {}, maxLat: {}, " +
          "minLng: {}, maxLng: {}, portfolioId: {}, tags: {}",
          minLat, maxLat, minLng, maxLng, portfolioId, tags);

      // Validate bounds - only check latitude (longitude can wrap around date line)
      if (minLat == null || maxLat == null || minLng == null || maxLng == null) {
        log.error("[GEOLOCATION] Missing required bounds parameters");
        return ResponseEntity.badRequest().build();
      }
      if (minLat >= maxLat) {
        log.error("[GEOLOCATION] Invalid bounds: minLat >= maxLat");
        return ResponseEntity.badRequest().build();
      }

      // Validate portfolio access if portfolioId is provided
      if (portfolioId != null && !securityService.isPortfolioMember(null, portfolioId)) {
        log.error("[GEOLOCATION] User {} does not have access to portfolio {}",
            user.getEmail(), portfolioId);
        return ResponseEntity.status(403).build();
      }

      List<Map<String, Object>> companies = companyExtractionDataService.getCompaniesInBounds(
          minLat, maxLat, minLng, maxLng, portfolioId, tags, user);

      log.info("[GEOLOCATION] Successfully retrieved {} companies in bounds", companies.size());
      return ResponseEntity.ok(companies);
    } catch (Exception e) {
      log.error("[GEOLOCATION] Error getting companies in bounds", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Calculate metrics for companies within geographic bounds.
   * Used to update dashboard metrics when map is zoomed/panned.
   * Handles date-line crossing when minLng > maxLng.
   */
  @GetMapping("/metrics-for-bounds")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, Object>> getMetricsForBounds(
      @RequestParam final Double minLat,
      @RequestParam final Double maxLat,
      @RequestParam final Double minLng,
      @RequestParam final Double maxLng,
      @RequestParam(required = false) final Long portfolioId,
      @RequestParam(required = false) final List<String> tags,
      @CurrentUser final User user) {
    try {
      log.info("[GEOLOCATION] Calculating metrics for bounds - minLat: {}, maxLat: {}, " +
          "minLng: {}, maxLng: {}, portfolioId: {}, tags: {}",
          minLat, maxLat, minLng, maxLng, portfolioId, tags);

      // Validate bounds - only check latitude (longitude can wrap around date line)
      if (minLat == null || maxLat == null || minLng == null || maxLng == null) {
        log.error("[GEOLOCATION] Missing required bounds parameters for metrics");
        return ResponseEntity.badRequest().build();
      }
      if (minLat >= maxLat) {
        log.error("[GEOLOCATION] Invalid bounds for metrics: minLat >= maxLat");
        return ResponseEntity.badRequest().build();
      }

      // Validate portfolio access if portfolioId is provided
      if (portfolioId != null && !securityService.isPortfolioMember(null, portfolioId)) {
        log.error("[GEOLOCATION] User {} does not have access to portfolio {} for metrics",
            user.getEmail(), portfolioId);
        return ResponseEntity.status(403).build();
      }

      Map<String, Object> metrics = companyExtractionDataService.calculateMetricsForBounds(
          minLat, maxLat, minLng, maxLng, portfolioId, tags, user);

      log.info("[GEOLOCATION] Successfully calculated metrics for bounds - {} total companies",
          metrics.get("totalCompanies"));
      return ResponseEntity.ok(metrics);
    } catch (Exception e) {
      log.error("[GEOLOCATION] Error calculating metrics for bounds", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  @PostMapping("/backfill-contact-data")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> backfillContactData(
      @RequestBody(required = false) Map<String, Object> params) {
    try {
      log.info("Starting contact data backfill process");
      
      // Extract parameters
      Integer limit = null;
      Integer batchSize = 5; // Default batch size
      
      if (params != null) {
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        if (params.containsKey("batchSize")) {
          batchSize = ((Number) params.get("batchSize")).intValue();
        }
      }
      
      log.info("Backfill parameters - Limit: {}, Batch size: {}", limit, batchSize);
      
      // Run the backfill
      Map<String, Object> result = contactDataBackfillService.backfillMissingContactData(limit, batchSize);
      
      log.info("Contact data backfill completed. Total processed: {}", 
               result.get("total_processed"));
      
      return ResponseEntity.ok(result);
      
    } catch (Exception e) {
      log.error("Error during contact data backfill", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Contact data backfill failed: " + e.getMessage())
      );
    }
  }

  /**
   * Backfill stakeholder geography summaries for existing companies.
   *
   * @param params optional limit and parallelThreads (default 5)
   * @return summary of the backfill operation
   */
  @PostMapping("/backfill-geography-summary")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> backfillGeographySummary(
      @RequestBody(required = false) Map<String, Object> params) {
    try {
      log.info("Starting geography summary backfill process");

      Integer limit = null;
      Integer parallelThreads = 15;

      if (params != null) {
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        if (params.containsKey("parallelThreads")) {
          parallelThreads = ((Number) params.get("parallelThreads")).intValue();
        }
      }

      log.info("Backfill parameters - Limit: {}, Parallel threads: {}",
          limit, parallelThreads);

      Map<String, Object> result = geographySummaryBackfillService
          .backfillGeographySummaries(limit, parallelThreads);

      log.info("Geography summary backfill completed. Total: {}",
          result.get("total_processed"));

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error during geography summary backfill", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Geography summary backfill failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/geocode-all")
  public ResponseEntity<Map<String, Object>> geocodeAllCompanies() {
    try {
      log.info("Starting batch geocoding of companies with missing coordinates");
      
      // First, let's see what we have in the database
      List<CompanyExtractionData> allCompanies = companyExtractionDataRepository.findAll();
      log.info("Total companies in database: {}", allCompanies.size());
      
      // Log details about each company
      for (CompanyExtractionData company : allCompanies) {
        log.info("Company: {} - Address: '{}' - Lat: {} - Lng: {}", 
                 company.getCompanyName(), 
                 company.getHeadquarterAddress(),
                 company.getLatitude(), 
                 company.getLongitude());
      }
      
      // Find all companies with address but no coordinates
      List<CompanyExtractionData> companiesNeedingGeocoding = companyExtractionDataRepository
          .findByHeadquarterAddressNotNullAndLatitudeIsNull();
      
      int totalToGeocode = companiesNeedingGeocoding.size();
      int successCount = 0;
      int failureCount = 0;
      
      log.info("Found {} companies needing geocoding", totalToGeocode);
      
      // Process in batches to avoid rate limits
      for (CompanyExtractionData company : companiesNeedingGeocoding) {
        try {
          String address = company.getHeadquarterAddress();
          if (address != null && !address.trim().isEmpty()) {
            GeocodingService.Coordinates coords = geocodingService.geocodeAddress(address);
            if (coords != null) {
              company.setLatitude(coords.latitude);
              company.setLongitude(coords.longitude);
              companyExtractionDataRepository.save(company);
              successCount++;
              log.debug("Geocoded company {}: {}", company.getCompanyName(), address);
            } else {
              failureCount++;
              log.debug("Failed to geocode company {}: {}", company.getCompanyName(), address);
            }
          }
          
          // Small delay to avoid rate limits (Google allows 50 requests/second)
          Thread.sleep(50); // 20 requests per second to be safe
          
        } catch (Exception e) {
          log.error("Error geocoding company {}: {}", company.getCompanyName(), e.getMessage());
          failureCount++;
        }
      }
      
      Map<String, Object> result = Map.of(
          "totalProcessed", totalToGeocode,
          "successCount", successCount,
          "failureCount", failureCount,
          "message", String.format("Geocoded %d of %d companies successfully", successCount, totalToGeocode)
      );
      
      log.info("Batch geocoding complete: {} success, {} failures", successCount, failureCount);
      return ResponseEntity.ok(result);
      
    } catch (Exception e) {
      log.error("Error in batch geocoding", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to geocode companies: " + e.getMessage())
      );
    }
  }
  
  @GetMapping("/emissions-status")
  public ResponseEntity<Map<String, Object>> getCarbonEmissionsStatus() {
    try {
      log.info("Checking carbon emissions status");
      
      // Get total companies
      long totalCompanies = companyExtractionDataRepository.count();
      
      // Get companies missing emissions
      List<CompanyExtractionData> missingEmissions = companyExtractionDataRepository.findCompaniesMissingCarbonEmissions();
      
      // Get companies with emissions (total - missing)
      long companiesWithEmissions = totalCompanies - missingEmissions.size();
      
      // Get sample of companies missing emissions
      List<Map<String, Object>> missingSample = missingEmissions.stream()
          .limit(10)
          .map(company -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", company.getId());
            info.put("company_name", company.getCompanyName());
            info.put("company_url", company.getCompanyUrl());
            info.put("last_modified", company.getLastModifiedAt());
            return info;
          })
          .collect(Collectors.toList());
      
      Map<String, Object> response = Map.of(
          "total_companies", totalCompanies,
          "companies_with_emissions", companiesWithEmissions,
          "companies_missing_emissions", missingEmissions.size(),
          "percentage_complete", totalCompanies > 0 ? 
              String.format("%.1f%%", (companiesWithEmissions * 100.0) / totalCompanies) : "0%",
          "missing_emissions_sample", missingSample
      );
      
      log.info("Carbon emissions status - Total: {}, With emissions: {}, Missing: {}", 
               totalCompanies, companiesWithEmissions, missingEmissions.size());
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error checking emissions status", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to check status: " + e.getMessage())
      );
    }
  }
  
  @PostMapping("/rerun-emissions")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunCarbonEmissions(
      @RequestBody final Map<String, Object> params) {
    try {
      log.info("=== STARTING CARBON EMISSIONS RERUN ===");

      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      boolean force = false;
      String userInstructions = null;

      if (params != null) {
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
        if (params.containsKey("force")) {
          force = (Boolean) params.get("force");
        }
        if (params.containsKey("userInstructions")
            && params.get("userInstructions") != null) {
          userInstructions = params.get("userInstructions").toString().trim();
          if (userInstructions.isEmpty()) {
            userInstructions = null;
          }
        }
      }

      log.info("Rerun parameters - IDs: {}, Limit: {}, dryRun: {}, force: {}",
               companyIds, limit, dryRun, force);

      // If specific IDs provided, process them directly
      if (companyIds != null && !companyIds.isEmpty()) {
        List<CompanyExtractionData> companies =
            companyExtractionDataRepository.findAllById(companyIds);
        if (limit != null && limit > 0 && companies.size() > limit) {
          companies = companies.subList(0, limit);
        }
        log.info("Processing {} specific companies", companies.size());
        return processEmissionsBatch(companies, dryRun, userInstructions, limit);
      }

      // Batched processing for force or missing-only modes
      int page = 0;
      int processedCount = 0;
      int successCount = 0;
      int failureCount = 0;
      List<Map<String, Object>> results = new ArrayList<>();

      while (true) {
        org.springframework.data.domain.Page<CompanyExtractionData> batch =
            companyExtractionDataRepository.findAll(
                PageRequest.of(page, RERUN_BATCH_SIZE,
                    Sort.by(Sort.Direction.ASC, "id")));

        if (!batch.hasContent()) {
          break;
        }

        log.info("Processing batch {} with {} companies", page,
                 batch.getContent().size());

        for (CompanyExtractionData company : batch.getContent()) {
          if (limit != null && limit > 0 && processedCount >= limit) {
            break;
          }

          // Skip companies that already have emissions unless force mode
          if (!force && company.getTotalCarbonEmissions() != null
              && !company.getTotalCarbonEmissions().trim().isEmpty()) {
            continue;
          }

          processedCount++;
          Map<String, Object> result = processSingleCompanyEmissions(
              company, dryRun, userInstructions);
          results.add(result);

          if ("success".equals(result.get("status"))) {
            successCount++;
          } else {
            failureCount++;
          }
        }

        if (limit != null && limit > 0 && processedCount >= limit) {
          break;
        }
        page++;
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_companies", processedCount);
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("dry_run", dryRun);
      response.put("force", force);
      response.put("results", results);

      if (successCount > 0 && !dryRun) {
        response.put("message", String.format(
            "Successfully reran carbon emissions for %d companies",
            successCount));
      } else if (dryRun) {
        response.put("message", "Dry run completed - no data was saved");
      } else {
        response.put("message", "Rerun completed");
      }

      log.info("=== CARBON EMISSIONS RERUN COMPLETED ===");
      log.info("Processed: {}, Success: {}, Failures: {}",
               processedCount, successCount, failureCount);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error in carbon emissions rerun", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }

  private ResponseEntity<Map<String, Object>> processEmissionsBatch(
      final List<CompanyExtractionData> companies,
      final boolean dryRun,
      final String userInstructions,
      final Integer limit) {

    List<Map<String, Object>> results = new ArrayList<>();
    int successCount = 0;
    int failureCount = 0;

    for (CompanyExtractionData company : companies) {
      Map<String, Object> result = processSingleCompanyEmissions(
          company, dryRun, userInstructions);
      results.add(result);

      if ("success".equals(result.get("status"))) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    Map<String, Object> response = new HashMap<>();
    response.put("total_companies", companies.size());
    response.put("success_count", successCount);
    response.put("failure_count", failureCount);
    response.put("dry_run", dryRun);
    response.put("results", results);

    if (successCount > 0 && !dryRun) {
      response.put("message", String.format(
          "Successfully reran carbon emissions for %d companies", successCount));
    } else if (dryRun) {
      response.put("message", "Dry run completed - no data was saved");
    } else {
      response.put("message", "Rerun completed");
    }

    return ResponseEntity.ok(response);
  }

  private Map<String, Object> processSingleCompanyEmissions(
      final CompanyExtractionData company,
      final boolean dryRun,
      final String userInstructions) {

    Map<String, Object> companyResult = new HashMap<>();
    companyResult.put("id", company.getId());
    companyResult.put("company_name", company.getCompanyName());
    companyResult.put("company_url", company.getCompanyUrl());

    try {
      log.info("Processing company {}: {}",
               company.getId(), company.getCompanyName());

      JsonNode emissionsResult;

      if (userInstructions != null && !userInstructions.isEmpty()) {
        log.info("Performing targeted update with user instructions");
        companyResult.put("update_type", "targeted");
        emissionsResult = carbonEmissionsService
            .updateEmissionsWithUserInstructions(company, userInstructions);
      } else {
        log.info("Performing full emissions recalculation");
        companyResult.put("update_type", "full");

        Map<String, Object> rawData = company.getRawExtractionData();
        if (rawData == null) {
          throw new IllegalStateException("No raw extraction data available");
        }

        Map<String, Object> completeData = new HashMap<>(rawData);
        addFieldIfPresent(completeData, "industry_sectors",
                          company.getIndustrySectors());
        addFieldIfPresent(completeData, "company_description",
                          company.getCompanyDescription());
        addFieldIfPresent(completeData, "company_name",
                          company.getCompanyName());
        addFieldIfPresent(completeData, "headquarter_address",
                          company.getHeadquarterAddress());
        addFieldIfPresent(completeData, "number_of_employees",
                          company.getNumberOfEmployees());
        if (company.getAnnualSales2024() != null) {
          completeData.put("annual_sales_2024", company.getAnnualSales2024());
        }
        if (company.getAnnualSales2023() != null) {
          completeData.put("annual_sales_2023", company.getAnnualSales2023());
        }
        if (company.getAnnualSales2022() != null) {
          completeData.put("annual_sales_2022", company.getAnnualSales2022());
        }

        JsonNode companyData = objectMapper.valueToTree(completeData);
        JsonNode filteredData = carbonEmissionsService
            .filterDataForCarbonCalculation(companyData);
        emissionsResult = carbonEmissionsService.execute(
            filteredData, company.getCompanyUrl());
      }

      String totalEmissions = emissionsResult
          .get("total_carbon_emissions").asText();
      String scope1 = emissionsResult.get("scope1_emissions").asText();
      String scope2 = emissionsResult.get("scope2_emissions").asText();
      String scope3 = emissionsResult.get("scope3_emissions").asText();

      companyResult.put("total_carbon_emissions", totalEmissions);
      companyResult.put("scope1_emissions", scope1);
      companyResult.put("scope2_emissions", scope2);
      companyResult.put("scope3_emissions", scope3);

      if (emissionsResult.has("emissions_breakdown")) {
        companyResult.put("emissions_breakdown",
            objectMapper.convertValue(
                emissionsResult.get("emissions_breakdown"), List.class));
      }

      if (!dryRun) {
        company.setTotalCarbonEmissions(totalEmissions);
        company.setScope1Emissions(scope1);
        company.setScope2Emissions(scope2);
        company.setScope3Emissions(scope3);

        Map<String, Object> updatedRawData = new HashMap<>(
            company.getRawExtractionData());
        updatedRawData.put("total_carbon_emissions", totalEmissions);
        updatedRawData.put("scope1_emissions", scope1);
        updatedRawData.put("scope2_emissions", scope2);
        updatedRawData.put("scope3_emissions", scope3);

        if (emissionsResult.has("emissions_breakdown")) {
          updatedRawData.put("emissions_breakdown",
              objectMapper.convertValue(
                  emissionsResult.get("emissions_breakdown"), List.class));
        }

        company.setRawExtractionData(updatedRawData);

        Map<String, Object> phasesCompleted =
            company.getExtractionPhasesCompleted();
        if (phasesCompleted == null) {
          phasesCompleted = new HashMap<>();
        }
        phasesCompleted.put("phase7_carbon_emissions", true);
        phasesCompleted.put("phase7_completed_at", System.currentTimeMillis());
        company.setExtractionPhasesCompleted(phasesCompleted);

        companyExtractionDataRepository.save(company);
        log.info("Saved carbon emissions for company {}", company.getId());
      }

      companyResult.put("status", "success");
      companyResult.put("message",
          dryRun ? "Dry run - not saved" : "Successfully calculated and saved");

    } catch (Exception e) {
      log.error("Error processing company {}: {}",
                company.getId(), e.getMessage(), e);
      companyResult.put("status", "error");
      companyResult.put("error", e.getMessage());
    }

    // Small delay to avoid overwhelming the API
    try {
      Thread.sleep(100);
    } catch (InterruptedException ie) {
      Thread.currentThread().interrupt();
    }

    return companyResult;
  }

  private void addFieldIfPresent(final Map<String, Object> data,
                                 final String key,
                                 final String value) {
    if (value != null && !value.trim().isEmpty()) {
      data.put(key, value);
    }
  }
  
  @PostMapping("/rerun-products-services")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunCoreProductsServices(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING CORE PRODUCTS/SERVICES RERUN ===");
      
      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      
      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
      }
      
      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);

      // Find companies that need processing
      List<CompanyExtractionData> companiesToProcess;
      
      if (companyIds != null && !companyIds.isEmpty()) {
        // Process specific companies
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id).ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        // Find all companies without core products/services
        companiesToProcess = companyExtractionDataRepository.findAll().stream()
            .filter(company -> company.getCoreProductsServices() == null || 
                              (company.getCoreProductsServices() instanceof Map && 
                               ((Map<?, ?>) company.getCoreProductsServices()).isEmpty()))
            .collect(Collectors.toList());
        log.info("Found {} companies missing core products/services data", companiesToProcess.size());
        
        // Apply limit if specified
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }
      
      // Process results tracking
      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;
      
      // Process each company
      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> companyResult = new HashMap<>();
        companyResult.put("id", company.getId());
        companyResult.put("company_name", company.getCompanyName());
        companyResult.put("company_url", company.getCompanyUrl());
        
        try {
          log.info("Processing company {}: {}", company.getId(), company.getCompanyName());
          
          // Build company data from existing extraction
          ObjectNode companyData = objectMapper.createObjectNode();
          
          // Add basic fields
          if (company.getCompanyName() != null) {
            companyData.put("company_name", company.getCompanyName());
          }
          if (company.getCompanyDescription() != null) {
            companyData.put("company_description", company.getCompanyDescription());
          }
          if (company.getIndustrySectors() != null) {
            companyData.put("industry_sectors", company.getIndustrySectors());
          }
          
          // Try to get additional fields from raw extraction data
          if (company.getRawExtractionData() != null) {
            Map<String, Object> rawData = company.getRawExtractionData();
            
            // Add business model, target market, mission, revenue model if available
            if (rawData.containsKey("business_model")) {
              companyData.put("business_model", rawData.get("business_model").toString());
            }
            if (rawData.containsKey("target_market")) {
              companyData.put("target_market", rawData.get("target_market").toString());
            }
            if (rawData.containsKey("mission")) {
              companyData.put("mission", rawData.get("mission").toString());
            }
            if (rawData.containsKey("revenue_model")) {
              companyData.put("revenue_model", rawData.get("revenue_model").toString());
            }
          }
          
          // Add theory of change if available
          if (company.getTheoryOfChange() != null && !company.getTheoryOfChange().trim().isEmpty()) {
            // Convert string to array format expected by Phase 8
            List<String> tocItems = new ArrayList<>();
            for (String item : company.getTheoryOfChange().split(",")) {
              tocItems.add(item.trim());
            }
            companyData.set("theory_of_change", objectMapper.valueToTree(tocItems));
          }
          
          // Run Phase 8
          JsonNode result = coreProductsServicesExtractionService.execute(
              companyData, company.getCompanyUrl());
          
          // Extract the core products/services
          if (result.has("core_products_services")) {
            Map<String, Object> coreProductsServices = objectMapper.convertValue(
                result.get("core_products_services"), Map.class);
            
            companyResult.put("core_products_services", coreProductsServices);
            
            if (!dryRun) {
              // Update the company entity
              company.setCoreProductsServices(coreProductsServices);
              
              // Update raw extraction data
              Map<String, Object> updatedRawData = company.getRawExtractionData();
              if (updatedRawData == null) {
                updatedRawData = new HashMap<>();
              }
              updatedRawData.put("core_products_services", coreProductsServices);
              company.setRawExtractionData(updatedRawData);
              
              // Update extraction phases completed
              Map<String, Object> phasesCompleted = company.getExtractionPhasesCompleted();
              if (phasesCompleted == null) {
                phasesCompleted = new HashMap<>();
              }
              phasesCompleted.put("phase8_core_products_services", true);
              phasesCompleted.put("phase8_completed_at", System.currentTimeMillis());
              company.setExtractionPhasesCompleted(phasesCompleted);
              
              // Save to database
              companyExtractionDataRepository.save(company);
              log.info("Successfully saved core products/services for company {}", company.getId());
            }
            
            companyResult.put("status", "success");
            companyResult.put("message", dryRun ? "Dry run - not saved" : "Successfully extracted and saved");
            successCount++;
          } else {
            throw new RuntimeException("No core products/services extracted");
          }
          
        } catch (Exception e) {
          log.error("Error processing company {}: {}", company.getId(), e.getMessage(), e);
          companyResult.put("status", "error");
          companyResult.put("error", e.getMessage());
          failureCount++;
        }
        
        results.add(companyResult);
        
        // Add a small delay to avoid overwhelming the API
        try {
          Thread.sleep(100); // 100ms delay between companies
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
        }
      }
      
      // Prepare response
      Map<String, Object> response = new HashMap<>();
      response.put("total_companies", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("dry_run", dryRun);
      response.put("results", results);
      
      if (successCount > 0 && !dryRun) {
        response.put("message", String.format("Successfully extracted core products/services for %d companies", successCount));
      } else if (dryRun) {
        response.put("message", "Dry run completed - no data was saved");
      } else {
        response.put("message", "Rerun completed with errors");
      }
      
      log.info("=== CORE PRODUCTS/SERVICES RERUN COMPLETED ===");
      log.info("Processed: {}, Success: {}, Failures: {}", 
               companiesToProcess.size(), successCount, failureCount);
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error in core products/services rerun", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }
  
  @GetMapping("/products-services-status")
  public ResponseEntity<Map<String, Object>> getCoreProductsServicesStatus() {
    try {
      log.info("Checking core products/services status");
      
      // Get total companies
      long totalCompanies = companyExtractionDataRepository.count();
      
      // Get companies missing core products/services
      List<CompanyExtractionData> allCompanies = companyExtractionDataRepository.findAll();
      List<CompanyExtractionData> missingProductsServices = allCompanies.stream()
          .filter(company -> company.getCoreProductsServices() == null || 
                            (company.getCoreProductsServices() instanceof Map && 
                             ((Map<?, ?>) company.getCoreProductsServices()).isEmpty()))
          .collect(Collectors.toList());
      
      // Get companies with products/services
      long companiesWithProductsServices = totalCompanies - missingProductsServices.size();
      
      // Get sample of companies missing products/services
      List<Map<String, Object>> missingSample = missingProductsServices.stream()
          .limit(10)
          .map(company -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", company.getId());
            info.put("company_name", company.getCompanyName());
            info.put("company_url", company.getCompanyUrl());
            info.put("last_modified", company.getLastModifiedAt());
            return info;
          })
          .collect(Collectors.toList());
      
      Map<String, Object> response = Map.of(
          "total_companies", totalCompanies,
          "companies_with_products_services", companiesWithProductsServices,
          "companies_missing_products_services", missingProductsServices.size(),
          "percentage_complete", totalCompanies > 0 ? 
              String.format("%.1f%%", (companiesWithProductsServices * 100.0) / totalCompanies) : "0%",
          "missing_products_services_sample", missingSample
      );
      
      log.info("Core products/services status - Total: {}, With data: {}, Missing: {}", 
               totalCompanies, companiesWithProductsServices, missingProductsServices.size());
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error checking products/services status", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to check status: " + e.getMessage())
      );
    }
  }
  
  @PostMapping("/test-phase8")
  public ResponseEntity<Map<String, Object>> testPhase8CoreProductsExtraction(@RequestBody Map<String, Object> testData) {
    try {
      log.info("=== TESTING PHASE 8: CORE PRODUCTS/SERVICES EXTRACTION ===");
      
      // Create a mock company data object from the test input
      ObjectNode mockCompanyData = objectMapper.createObjectNode();
      
      // Add required fields from test data
      mockCompanyData.put("company_name", testData.getOrDefault("company_name", "Test Company").toString());
      mockCompanyData.put("company_description", testData.getOrDefault("company_description", 
          "We are a technology company focused on AI solutions").toString());
      mockCompanyData.put("industry_sectors", testData.getOrDefault("industry_sectors", 
          "Technology, Artificial Intelligence").toString());
      mockCompanyData.put("business_model", testData.getOrDefault("business_model", 
          "B2B SaaS").toString());
      mockCompanyData.put("target_market", testData.getOrDefault("target_market", 
          "Enterprise customers").toString());
      mockCompanyData.put("mission", testData.getOrDefault("mission", 
          "To democratize AI for businesses").toString());
      mockCompanyData.put("revenue_model", testData.getOrDefault("revenue_model", 
          "Subscription-based").toString());
      
      // Add theory of change if provided
      if (testData.containsKey("theory_of_change")) {
        mockCompanyData.set("theory_of_change", objectMapper.valueToTree(testData.get("theory_of_change")));
      }
      
      String companyUrl = testData.getOrDefault("company_url", "https://example.com").toString();
      
      log.info("Running Phase 8 with mock data for company: {}", mockCompanyData.get("company_name"));
      
      // Execute Phase 8 only
      JsonNode result = coreProductsServicesExtractionService.execute(mockCompanyData, companyUrl);
      
      // Extract just the core products/services from the result
      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("company_name", result.get("company_name").asText());
      
      if (result.has("core_products_services")) {
        response.put("core_products_services", objectMapper.convertValue(
            result.get("core_products_services"), Map.class));
      } else {
        response.put("core_products_services", null);
        response.put("message", "No core products/services extracted");
      }
      
      log.info("Phase 8 test completed successfully");
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error testing Phase 8", e);
      return ResponseEntity.badRequest().body(
          Map.of(
              "success", false,
              "error", "Phase 8 test failed: " + e.getMessage()
          )
      );
    }
  }

  @PostMapping("/rerun-esg-risk")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunEsgRiskScores(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING ESG RISK SCORES RERUN ===");
      
      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      boolean force = false;
      
      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
        
        if (params.containsKey("force")) {
          force = (Boolean) params.get("force");
        }
      }
      
      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}, Force: {}",
               companyIds, limit, dryRun, force);

      // Find companies that need rerun
      List<CompanyExtractionData> companiesToProcess;
      
      if (companyIds != null && !companyIds.isEmpty()) {
        // Process specific companies
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id).ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        // Find companies based on force parameter
        if (force) {
          // Force mode: process ALL companies regardless of existing ESG scores
          companiesToProcess = companyExtractionDataRepository.findAll();
          log.info("Force mode: Found {} total companies to process", companiesToProcess.size());
        } else {
          // Normal mode: only process companies missing ESG risk scores
          companiesToProcess = companyExtractionDataRepository.findAll().stream()
              .filter(company -> company.getEsgRiskEnvironmentalInherent() == null ||
                                company.getEsgRiskSocialInherent() == null ||
                                company.getEsgRiskGovernanceInherent() == null)
              .collect(Collectors.toList());
          log.info("Found {} companies missing ESG risk score data", companiesToProcess.size());
        }
        
        // Apply limit if specified
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }
      
      // Process results tracking
      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;
      
      ObjectMapper objectMapper = new ObjectMapper();
      
      // Process each company
      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> result = new HashMap<>();
        result.put("company_id", company.getId());
        result.put("company_name", company.getCompanyName());
        result.put("company_url", company.getCompanyUrl());
        
        try {
          if (dryRun) {
            // Dry run - just check what would be processed
            result.put("status", "dry_run");
            result.put("message", "Would process ESG risk scores");
            result.put("has_existing_scores", company.getEsgRiskEnvironmentalInherent() != null);
          } else {
            // Load existing extraction data
            JsonNode existingData = objectMapper.readTree(
                objectMapper.writeValueAsString(company.getRawExtractionData())
            );
            
            // Filter data to exclude existing ESG scores for clean recalculation
            JsonNode filteredData = esgRiskScoreService.filterDataForEsgCalculation(existingData);
            
            // Execute Phase 9: ESG Risk Score Calculation with clean data
            JsonNode updatedData = esgRiskScoreService.execute(filteredData, company.getCompanyUrl());
            
            // Save the updated data
            String updatedJsonString = objectMapper.writeValueAsString(updatedData);
            CompanyExtractionData savedData = companyExtractionDataService.saveExtractionData(
                company.getCompanyUrl(), updatedJsonString
            );
            
            result.put("status", "success");
            result.put("esg_risk_environmental_inherent", savedData.getEsgRiskEnvironmentalInherent());
            result.put("esg_risk_environmental_adjusted", savedData.getEsgRiskEnvironmentalAdjusted());
            result.put("esg_risk_social_inherent", savedData.getEsgRiskSocialInherent());
            result.put("esg_risk_social_adjusted", savedData.getEsgRiskSocialAdjusted());
            result.put("esg_risk_governance_inherent", savedData.getEsgRiskGovernanceInherent());
            result.put("esg_risk_governance_adjusted", savedData.getEsgRiskGovernanceAdjusted());
            result.put("esg_risk_total_inherent", savedData.getEsgRiskTotalInherent());
            result.put("esg_risk_total_adjusted", savedData.getEsgRiskTotalAdjusted());
            
            successCount++;
            log.info("Successfully calculated ESG risk scores for company {}: E={}/{}, S={}/{}, G={}/{}", 
                     company.getId(),
                     savedData.getEsgRiskEnvironmentalInherent(), savedData.getEsgRiskEnvironmentalAdjusted(),
                     savedData.getEsgRiskSocialInherent(), savedData.getEsgRiskSocialAdjusted(),
                     savedData.getEsgRiskGovernanceInherent(), savedData.getEsgRiskGovernanceAdjusted());
          }
        } catch (Exception e) {
          result.put("status", "error");
          result.put("error", e.getMessage());
          failureCount++;
          log.error("Failed to calculate ESG risk scores for company {}: {}", 
                    company.getId(), e.getMessage());
        }
        
        results.add(result);
        
        // Add a small delay to avoid overwhelming the API
        try {
          Thread.sleep(100); // 100ms delay between companies
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
        }
      }
      
      // Summary response
      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("dry_run", dryRun);
      response.put("results", results);
      
      log.info("=== ESG RISK SCORES RERUN COMPLETED: {}/{} successful ===", 
               successCount, companiesToProcess.size());
      
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error during ESG risk scores rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }

  /**
   * Regenerate the Foresight Portfolio Intelligence Snapshot narrative text
   * for one or more companies. The narrative is produced against the latest
   * polar chart data, so newly populated company fields (e.g. annual sales)
   * are reflected after calling this endpoint.
   *
   * @param params request body with companyIds list
   * @return summary with per-company success/failure
   */
  @PostMapping("/rerun-narrative")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunNarrative(
      @RequestBody final Map<String, Object> params) {
    try {
      log.info("=== STARTING FORESIGHT NARRATIVE RERUN ===");

      List<Long> companyIds = null;
      if (params != null && params.containsKey("companyIds")
          && params.get("companyIds") != null) {
        Object ids = params.get("companyIds");
        if (ids instanceof List) {
          companyIds = ((List<?>) ids).stream()
              .map(id -> Long.valueOf(id.toString()))
              .collect(Collectors.toList());
        }
      }

      if (companyIds == null || companyIds.isEmpty()) {
        return ResponseEntity.badRequest().body(
            Map.of("error", "companyIds is required")
        );
      }

      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;

      for (Long id : companyIds) {
        Map<String, Object> result = new HashMap<>();
        result.put("company_id", id);
        try {
          boolean regenerated = companyPortfolioNarrativeService
              .forceRegenerateNarrative(id);
          if (regenerated) {
            result.put("status", "success");
            successCount++;
            log.info("Regenerated narrative for company {}", id);
          } else {
            result.put("status", "error");
            result.put("error", "Narrative generation returned no content");
            failureCount++;
          }
        } catch (Exception e) {
          result.put("status", "error");
          result.put("error", e.getMessage());
          failureCount++;
          log.error("Failed to regenerate narrative for company {}: {}",
              id, e.getMessage());
        }
        results.add(result);
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companyIds.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("results", results);

      log.info("=== FORESIGHT NARRATIVE RERUN COMPLETED: {}/{} successful ===",
          successCount, companyIds.size());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error during foresight narrative rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/rerun-sbmo")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunSBMOScores(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING SBMO SCORES RERUN ===");
      log.info("Received params: {}", params);
      
      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      
      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
      }
      
      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);

      // Find companies that need rerun
      List<CompanyExtractionData> companiesToProcess;
      
      if (companyIds != null && !companyIds.isEmpty()) {
        // Process specific companies
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id).ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        // Find all companies missing SBMO scores
        companiesToProcess = companyExtractionDataRepository.findAll().stream()
            .filter(company -> company.getSbmoCriteriaAScore() == null ||
                              company.getSbmoCriteriaBScore() == null ||
                              company.getSbmoCriteriaCScore() == null ||
                              company.getSbmoCriteriaDScore() == null ||
                              company.getSbmoTotalScore() == null)
            .collect(Collectors.toList());
        log.info("Found {} companies missing SBMO score data", companiesToProcess.size());
        
        // Apply limit if specified
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }
      
      // Process results tracking
      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;
      
      ObjectMapper objectMapper = new ObjectMapper();
      
      // Process each company
      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> result = new HashMap<>();
        result.put("company_id", company.getId());
        result.put("company_name", company.getCompanyName());
        result.put("company_url", company.getCompanyUrl());
        
        try {
          // Always execute the SBMO calculation to test it works
          // Load existing extraction data
          JsonNode existingData = objectMapper.readTree(
              objectMapper.writeValueAsString(company.getRawExtractionData())
          );
            
          // Execute Phase 10: SBMO Score Calculation
          JsonNode updatedData = sustainabilityBusinessModelOrientationService.execute(existingData, company.getCompanyUrl());
          
          if (dryRun) {
            // Dry run - extract scores but don't save
            result.put("status", "dry_run");
            result.put("message", "Dry run - calculated but not saved");
            result.put("sbmo_criteria_a_score", updatedData.path("sbmo_criteria_a_score").asDouble());
            result.put("sbmo_criteria_b_score", updatedData.path("sbmo_criteria_b_score").asDouble());
            result.put("sbmo_criteria_c_score", updatedData.path("sbmo_criteria_c_score").asDouble());
            result.put("sbmo_criteria_d_score", updatedData.path("sbmo_criteria_d_score").asDouble());
            result.put("sbmo_total_score", updatedData.path("sbmo_total_score").asDouble());
            
            // Include explanations in dry run for debugging
            result.put("sbmo_criteria_a_explanation", updatedData.path("sbmo_criteria_a_explanation").asText());
            result.put("sbmo_criteria_b_explanation", updatedData.path("sbmo_criteria_b_explanation").asText());
            result.put("sbmo_criteria_c_explanation", updatedData.path("sbmo_criteria_c_explanation").asText());
            result.put("sbmo_criteria_d_explanation", updatedData.path("sbmo_criteria_d_explanation").asText());
          } else {
            // Save the updated data
            String updatedJsonString = objectMapper.writeValueAsString(updatedData);
            CompanyExtractionData savedData = companyExtractionDataService.saveExtractionData(
                company.getCompanyUrl(), updatedJsonString
            );
            
            result.put("status", "success");
            result.put("sbmo_criteria_a_score", savedData.getSbmoCriteriaAScore());
            result.put("sbmo_criteria_b_score", savedData.getSbmoCriteriaBScore());
            result.put("sbmo_criteria_c_score", savedData.getSbmoCriteriaCScore());
            result.put("sbmo_criteria_d_score", savedData.getSbmoCriteriaDScore());
            result.put("sbmo_total_score", savedData.getSbmoTotalScore());
          }
          successCount++;
        } catch (Exception e) {
          log.error("Failed to process SBMO scores for company {}: {}", 
                   company.getCompanyUrl(), e.getMessage());
          result.put("status", "error");
          result.put("error", e.getMessage());
          failureCount++;
        }
        
        results.add(result);
      }
      
      // Invalidate metrics cache if we made changes
      if (!dryRun && successCount > 0) {
        metricsCacheService.invalidateCache();
        log.info("Invalidated metrics cache after SBMO scores update");
      }
      
      // Build response
      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("dry_run", dryRun);
      response.put("results", results);
      
      log.info("=== SBMO SCORES RERUN COMPLETED: {}/{} successful ===", 
               successCount, companiesToProcess.size());
      
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error during SBMO scores rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/rerun-growth-likelihood")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunGrowthLikelihood(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING GROWTH LIKELIHOOD RERUN ===");
      log.info("Received params: {}", params);

      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;

      if (params != null) {
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        if (params.containsKey("limit") && params.get("limit") != null) {
          limit = ((Number) params.get("limit")).intValue();
        }
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
      }

      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);

      List<CompanyExtractionData> companiesToProcess;
      if (companyIds != null && !companyIds.isEmpty()) {
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id).ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        companiesToProcess = companyExtractionDataRepository.findAll().stream()
            .filter(company -> company.getGrowthCompositeScore() == null)
            .collect(Collectors.toList());
        log.info("Found {} companies missing growth likelihood data", companiesToProcess.size());

        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }

      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;

      ObjectMapper mapper = objectMapper;

      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> result = new HashMap<>();
        result.put("company_id", company.getId());
        result.put("company_name", company.getCompanyName());
        result.put("company_url", company.getCompanyUrl());

        try {
          JsonNode rawNode = company.getRawExtractionData() != null
              ? mapper.valueToTree(company.getRawExtractionData())
              : mapper.createObjectNode();
          ObjectNode existingData = rawNode != null && rawNode.isObject()
              ? (ObjectNode) rawNode
              : mapper.createObjectNode();

          // Backfill key fields from entity in case raw data is missing them
          if (!existingData.has("company_name") && company.getCompanyName() != null) {
            existingData.put("company_name", company.getCompanyName());
          }
          if (!existingData.has("company_description") && company.getCompanyDescription() != null) {
            existingData.put("company_description", company.getCompanyDescription());
          }
          if (!existingData.has("number_of_employees") && company.getNumberOfEmployees() != null) {
            existingData.put("number_of_employees", company.getNumberOfEmployees());
          }
          if (!existingData.has("headquarter_address") && company.getHeadquarterAddress() != null) {
            existingData.put("headquarter_address", company.getHeadquarterAddress());
          }
          if (!existingData.has("industry_sectors") && company.getIndustrySectors() != null) {
            existingData.put("industry_sectors", company.getIndustrySectors());
          }
          if (!existingData.has("total_funding_amount") && company.getTotalFundingAmount() != null) {
            existingData.put("total_funding_amount", company.getTotalFundingAmount());
          }
          if (!existingData.has("funding_currency") && company.getFundingCurrency() != null) {
            existingData.put("funding_currency", company.getFundingCurrency());
          }
          if (!existingData.has("legal_entity_formation_date") && company.getLegalEntityFormationDate() != null) {
            existingData.put("legal_entity_formation_date", company.getLegalEntityFormationDate());
          }

          JsonNode updatedData = growthLikelihoodService.execute(existingData, company.getCompanyUrl());

          if (dryRun) {
            result.put("status", "dry_run");
            result.put("growth_media_reach_score", updatedData.path("growth_media_reach_score").asDouble());
            result.put("growth_sentiment_score", updatedData.path("growth_sentiment_score").asDouble());
            result.put("growth_innovation_visibility_score",
                       updatedData.path("growth_innovation_visibility_score").asDouble());
            result.put("growth_team_strength_score", updatedData.path("growth_team_strength_score").asDouble());
            result.put("growth_funding_velocity_score",
                       updatedData.path("growth_funding_velocity_score").asDouble());
            result.put("growth_company_age_score", updatedData.path("growth_company_age_score").asDouble());
            result.put("growth_composite_score", updatedData.path("growth_composite_score").asDouble());
            if (updatedData.has("growth_summary")) {
              result.put("growth_summary", updatedData.get("growth_summary").asText());
            }
          } else {
            String updatedJsonString = mapper.writeValueAsString(updatedData);
            CompanyExtractionData savedData = companyExtractionDataService.saveExtractionData(
                company.getCompanyUrl(), updatedJsonString
            );
            result.put("status", "success");
            result.put("growth_media_reach_score", savedData.getGrowthMediaReachScore());
            result.put("growth_sentiment_score", savedData.getGrowthSentimentScore());
            result.put("growth_innovation_visibility_score", savedData.getGrowthInnovationVisibilityScore());
            result.put("growth_team_strength_score", savedData.getGrowthTeamStrengthScore());
            result.put("growth_funding_velocity_score", savedData.getGrowthFundingVelocityScore());
            result.put("growth_company_age_score", savedData.getGrowthCompanyAgeScore());
            result.put("growth_composite_score", savedData.getGrowthCompositeScore());
          }
          successCount++;
        } catch (Exception e) {
          log.error("Failed to process growth likelihood for company {}: {}",
                   company.getCompanyUrl(), e.getMessage());
          result.put("status", "error");
          result.put("error", e.getMessage());
          failureCount++;
        }

        results.add(result);
      }

      if (!dryRun && successCount > 0) {
        metricsCacheService.invalidateCache();
        log.info("Invalidated metrics cache after growth likelihood update");
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("dry_run", dryRun);
      response.put("results", results);

      log.info("=== GROWTH LIKELIHOOD RERUN COMPLETED: {}/{} successful ===",
               successCount, companiesToProcess.size());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error during growth likelihood rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Rerun failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/rerun-patents")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  @Async
  public ResponseEntity<Map<String, Object>> rerunPatents(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING PATENTS RERUN ===");
      
      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      Integer delaySeconds = 300; // Default 5 minutes delay between companies
      
      if (params != null) {
        // Handle company IDs - could be array of numbers
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        
        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }
        
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
        
        if (params.containsKey("delaySeconds")) {
          delaySeconds = ((Number) params.get("delaySeconds")).intValue();
        }
      }
      
      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}, Delay: {}s",
               companyIds, limit, dryRun, delaySeconds);

      // Find companies that need rerun
      List<CompanyExtractionData> companiesToProcess;
      
      if (companyIds != null && !companyIds.isEmpty()) {
        // Process specific companies
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id).ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        // Find all companies missing patent data
        companiesToProcess = companyExtractionDataRepository.findAll().stream()
            .filter(c -> c.getTotalPatents() == null || c.getTotalPatents() == 0)
            .filter(c -> c.getCompanyName() != null && !c.getCompanyName().trim().isEmpty())
            .collect(Collectors.toList());
        log.info("Found {} companies missing patent data", companiesToProcess.size());
        
        // Apply limit if specified
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }
      
      // Process results tracking
      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;
      int skippedCount = 0;
      
      // Process each company
      for (int i = 0; i < companiesToProcess.size(); i++) {
        CompanyExtractionData company = companiesToProcess.get(i);
        Map<String, Object> companyResult = new HashMap<>();
        companyResult.put("id", company.getId());
        companyResult.put("company_name", company.getCompanyName());
        companyResult.put("company_url", company.getCompanyUrl());
        
        try {
          log.info("[{}/{}] Processing patents for company {}: {}", 
                   i + 1, companiesToProcess.size(), company.getId(), company.getCompanyName());
          
          if (dryRun) {
            log.info("DRY RUN - Would process patents for: {}", company.getCompanyName());
            companyResult.put("status", "dry_run");
            skippedCount++;
          } else {
            // Run patent extraction
            PatentCountModel patentData = patentCounterService.countPatents(
                company.getCompanyName(),
                company.getCompanyUrl() != null ? company.getCompanyUrl() : "",
                false,  // euOnly = false (worldwide search)
                false,  // grantsOnly = false (include applications)
                false,  // countOnly = false (get full details)
                true    // saveToDatabase = true
            );
            
            if (patentData != null) {
              // Check if scraping was successful (patent count >= 0)
              if (patentData.getPatentCount() >= 0) {
                // Update company with patent counts only if scraping was successful
                company.setTotalPatents(patentData.getPatentCount());
                company.setGrantedPatents(patentData.getGrantedPatentCount());
                company.setPatentApplications(patentData.getApplicationCount());
                companyExtractionDataRepository.save(company);
                
                companyResult.put("status", "success");
                companyResult.put("total_patents", patentData.getPatentCount());
                companyResult.put("granted_patents", patentData.getGrantedPatentCount());
                companyResult.put("patent_applications", patentData.getApplicationCount());
                
                log.info("Successfully extracted {} patents for {}", 
                         patentData.getPatentCount(), company.getCompanyName());
                successCount++;
              } else {
                // Scraping was unsuccessful (possibly blocked)
                companyResult.put("status", "unsuccessful");
                companyResult.put("message", "Unable to determine patent count - page might be blocked");
                log.warn("Patent scraping unsuccessful for company {}, leaving data as NULL", company.getCompanyName());
              }
            } else {
              companyResult.put("status", "no_data");
              log.warn("No patent data returned for {}", company.getCompanyName());
              failureCount++;
            }
          }
          
          // Add delay between companies to avoid Google blocking (except for last company)
          if (i < companiesToProcess.size() - 1 && delaySeconds > 0 && !dryRun) {
            log.info("Waiting {} seconds before next company...", delaySeconds);
            Thread.sleep(delaySeconds * 1000L);
          }
          
        } catch (Exception e) {
          log.error("Failed to process patents for company {}: {}", 
                    company.getCompanyName(), e.getMessage());
          companyResult.put("status", "error");
          companyResult.put("error", e.getMessage());
          failureCount++;
        }
        
        results.add(companyResult);
      }
      
      // Build response
      Map<String, Object> response = new HashMap<>();
      response.put("total_companies", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("skipped_count", skippedCount);
      response.put("results", results);
      
      if (dryRun) {
        response.put("message", "Dry run completed - no data was saved");
      } else if (failureCount == 0) {
        response.put("message", "Patent rerun completed successfully");
      } else {
        response.put("message", "Patent rerun completed with " + failureCount + " failures");
      }
      
      log.info("=== PATENT RERUN COMPLETED - Success: {}, Failed: {}, Skipped: {} ===",
               successCount, failureCount, skippedCount);
      
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error during patent rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Patent rerun failed: " + e.getMessage())
      );
    }
  }

  /**
   * Import website traffic data from Excel file
   * Accepts .xlsx or .xls files with traffic data
   * Expected format: Row 1 = company domains, Column A = dates, cells = traffic values
   */
  @PostMapping(value = "/import-traffic", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> importTrafficData(
      @RequestPart("file") MultipartFile file) {
    try {
      log.info("=== STARTING WEBSITE TRAFFIC DATA IMPORT ===");
      log.info("File: {}, Size: {} bytes", file.getOriginalFilename(), file.getSize());
      
      // Validate file
      if (file.isEmpty()) {
        return ResponseEntity.badRequest().body(
            Map.of("error", "File is empty")
        );
      }
      
      String filename = file.getOriginalFilename();
      if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
        return ResponseEntity.badRequest().body(
            Map.of("error", "File must be an Excel file (.xlsx or .xls)")
        );
      }
      
      // Import the traffic data
      Map<String, Object> result = websiteTrafficImportService.importTrafficData(file);
      
      log.info("=== TRAFFIC DATA IMPORT COMPLETED ===");
      log.info("Results: {} success, {} failed, {} not found", 
               result.get("success_count"), 
               result.get("failure_count"),
               result.get("not_found_count"));
      
      return ResponseEntity.ok(result);
      
    } catch (Exception e) {
      log.error("Error importing traffic data", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Import failed: " + e.getMessage())
      );
    }
  }
  
  /**
   * Recalculate growth metrics for all companies with traffic data.
   * Useful when growth calculation logic changes.
   */
  @PostMapping("/recalculate-growth")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> recalculateGrowthMetrics() {
    try {
      log.info("=== STARTING GROWTH METRICS RECALCULATION ===");
      
      Map<String, Object> result = websiteTrafficImportService.recalculateAllGrowthMetrics();
      
      log.info("=== GROWTH METRICS RECALCULATION COMPLETED ===");
      log.info("Result: {}", result);
      
      return ResponseEntity.ok(result);
      
    } catch (Exception e) {
      log.error("Error recalculating growth metrics", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Recalculation failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/rerun/patent-details")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunPatentDetails(
      @RequestBody Map<String, Object> request) {
    try {
      log.info("Starting manual patent detail extraction");
      
      List<Long> patentIds;
      
      // Check for backfill mode
      if (Boolean.TRUE.equals(request.get("backfill"))) {
        // Backfill mode: find patents without details
        Integer limit = request.containsKey("limit") ? 
            ((Number) request.get("limit")).intValue() : 1000000; // Default all
        
        patentIds = companyPatentRepository.findPatentsNeedingDetails(
            org.springframework.data.domain.PageRequest.of(0, limit));
        
        if (patentIds.isEmpty()) {
          return ResponseEntity.ok(Map.of(
              "status", "success",
              "message", "No patents need detail extraction"
          ));
        }
        
        log.info("Backfill mode: Found {} patents needing details", patentIds.size());
      } else {
        // Manual mode: require patent IDs
        if (!request.containsKey("patentIds")) {
          return ResponseEntity.badRequest().body(Map.of(
              "status", "error",
              "message", "patentIds required (or use backfill: true)"
          ));
        }
        
        patentIds = ((List<?>) request.get("patentIds")).stream()
            .map(id -> Long.valueOf(id.toString()))
            .collect(Collectors.toList());
        
        if (patentIds.isEmpty()) {
          return ResponseEntity.badRequest().body(Map.of(
              "status", "error",
              "message", "patentIds list cannot be empty"
          ));
        }
      }
      
      // Use -1 to indicate random delay mode (20-90 seconds per patent)
      boolean useRandomDelay = Boolean.TRUE.equals(request.get("backfill"));
      patentDetailService.scrapePatentDetailsManual(patentIds, useRandomDelay ? -1 : 30);
      
      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", "Started patent detail extraction");
      response.put("patentCount", patentIds.size());
      response.put("patentIds", patentIds);
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error in patent detail rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Patent detail extraction failed: " + e.getMessage())
      );
    }
  }
  
  /**
   * Get patent events for user's accessible companies.
   */
  @GetMapping("/patent-events")
  @PreAuthorize("isAuthenticated() and (#companyId == null or canAccessCompany(#companyId))")
  public ResponseEntity<Map<String, Object>> getPatentEvents(
      @CurrentUser User user,
      @RequestParam(defaultValue = "7") int days,
      @RequestParam(required = false) Long companyId) {
    try {
      List<PatentEvent> events;

      if (companyId != null) {
        // Get events for specific company (authorization already checked)
        events = patentEventService.getCompanyEvents(companyId);
      } else if (user.getRole() == io.ventureplatform.entity.enums.UserRole.ROLE_ADMIN) {
        // Super admin sees all recent events
        events = patentEventService.getRecentEvents(days);
      } else {
        // Regular user sees events for their accessible companies
        events = patentEventService.getEventsForUser(user, days, null);
      }
      
      // Convert events to DTOs
      List<Map<String, Object>> eventDtos = events.stream()
          .map(event -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", event.getId());
            dto.put("companyId", event.getCompanyExtractionData().getId());
            dto.put("companyName", event.getCompanyExtractionData().getCompanyName());
            if (event.getCompanyPatent() != null) {
              dto.put("patentNumber", event.getCompanyPatent().getPatentNumber());
              dto.put("patentTitle", event.getCompanyPatent().getTitle());
            }
            dto.put("eventType", event.getEventType());
            dto.put("description", patentEventService.generateDescription(event));
            dto.put("oldValue", event.getOldValue());
            dto.put("newValue", event.getNewValue());
            dto.put("createdAt", event.getCreatedAt());
            return dto;
          })
          .collect(Collectors.toList());
      
      Map<String, Object> response = new HashMap<>();
      response.put("events", eventDtos);
      response.put("count", eventDtos.size());
      response.put("period", companyId != null ? "all" : days + " days");
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Error fetching patent events", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to fetch patent events: " + e.getMessage())
      );
    }
  }
  
  /**
   * Manually trigger patent update check.
   */
  @PostMapping("/check-patents")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> checkForNewPatents() {
    try {
      log.info("Manually triggering patent check");
      
      int companiesChecked = patentCounterService.checkForNewPatents();
      
      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("companiesChecked", companiesChecked);
      response.put("message", String.format("Checked %d companies for new patents", companiesChecked));
      
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error checking for new patents", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Patent check failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/rerun-theory-of-change")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunTheoryOfChange(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING THEORY OF CHANGE RERUN ===");

      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      boolean abcOnly = false;
      java.time.Instant skipUpdatedSince = null;

      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }

        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }

        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }

        if (params.containsKey("abcOnly")) {
          abcOnly = (Boolean) params.get("abcOnly");
        }

        if (params.containsKey("skipUpdatedSince")) {
          String timestamp = params.get("skipUpdatedSince").toString();
          skipUpdatedSince = java.time.Instant.parse(timestamp);
        }
      }

      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);
      log.info("ABC-only rerun: {}, skipUpdatedSince: {}", abcOnly, skipUpdatedSince);

      // Process specific IDs directly; otherwise stream in batches to keep memory bounded
      if (companyIds != null && !companyIds.isEmpty()) {
        List<CompanyExtractionData> companiesToProcess = companyExtractionDataRepository.findAllById(companyIds);
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
        }
        return processTheoryOfChangeBatch(companiesToProcess, dryRun, abcOnly, limit);
      }

      int page = 0;
      AtomicInteger processedCount = new AtomicInteger(0);
      AtomicInteger successCount = new AtomicInteger(0);
      AtomicInteger failureCount = new AtomicInteger(0);
      ConcurrentLinkedQueue<Map<String, Object>> results = new ConcurrentLinkedQueue<>();
      AtomicInteger skippedCount = new AtomicInteger(0);
      final boolean finalAbcOnly = abcOnly;
      final boolean finalDryRun = dryRun;
      final Integer finalLimit = limit;
      final java.time.Instant finalSkipUpdatedSince = skipUpdatedSince;

      // Create thread pool for parallel processing (reused across batches)
      ExecutorService executor = Executors.newFixedThreadPool(PARALLEL_PROCESSING_THREADS);

      log.info("Starting streamed Theory of Change rerun with {} parallel threads", PARALLEL_PROCESSING_THREADS);

      try {
        while (true) {
          org.springframework.data.domain.Page<CompanyExtractionData> batch =
              companyExtractionDataRepository.findAll(
                  PageRequest.of(page, RERUN_BATCH_SIZE, Sort.by(Sort.Direction.ASC, "id")));

          if (!batch.hasContent()) {
            break;
          }

          // Filter companies that should be processed in this batch
          List<CompanyExtractionData> companiesToProcessInBatch = new ArrayList<>();
          for (CompanyExtractionData company : batch.getContent()) {
            if (finalLimit != null && finalLimit > 0 && processedCount.get() >= finalLimit) {
              break;
            }

            if (finalSkipUpdatedSince != null && company.getLastModifiedAt() != null
                && company.getLastModifiedAt().toInstant().isAfter(finalSkipUpdatedSince)) {
              skippedCount.incrementAndGet();
              continue;
            }

            JsonNode rawData = company.getRawExtractionData() != null
                ? objectMapper.valueToTree(company.getRawExtractionData())
                : null;

            boolean hasToc = rawData != null
                && rawData.has("theory_of_change")
                && rawData.get("theory_of_change").isArray()
                && rawData.get("theory_of_change").size() > 0;

            boolean shouldProcess;
            if (finalAbcOnly) {
              shouldProcess = hasToc;
            } else {
              shouldProcess = true;
            }

            if (!shouldProcess) {
              continue;
            }

            processedCount.incrementAndGet();

            if (finalDryRun) {
              Map<String, Object> item = new HashMap<>();
              item.put("id", company.getId());
              item.put("name", company.getCompanyName() != null ? company.getCompanyName() : "Unknown");
              item.put("url", company.getCompanyUrl());
              item.put("hasTheoryOfChange", hasToc);
              if (hasToc && rawData != null) {
                item.put("impactAreasCount", rawData.get("theory_of_change").size());
              }
              results.add(item);
              continue;
            }

            companiesToProcessInBatch.add(company);
          }

          // Process the filtered batch in parallel (skip if dry run)
          if (!finalDryRun && !companiesToProcessInBatch.isEmpty()) {
            log.info("Processing batch of {} companies in parallel (page {})",
                     companiesToProcessInBatch.size(), page);

            List<CompletableFuture<Void>> futures = companiesToProcessInBatch.stream()
                .map(company -> CompletableFuture.runAsync(() -> {
                  Map<String, Object> result = new HashMap<>();
                  result.put("company_id", company.getId());
                  result.put("company_name", company.getCompanyName());
                  result.put("company_url", company.getCompanyUrl());

                  try {
                    log.info("Processing Theory of Change{} for company: {} (ID: {})",
                             finalAbcOnly ? " (ABC-only)" : "", company.getCompanyName(), company.getId());

                    JsonNode existingData = company.getRawExtractionData() != null
                        ? objectMapper.valueToTree(company.getRawExtractionData())
                        : objectMapper.createObjectNode();

                    JsonNode updatedData;
                    if (finalAbcOnly) {
                      JsonNode tocNode = existingData.get("theory_of_change");
                      if (tocNode == null || !tocNode.isArray() || tocNode.size() == 0) {
                        result.put("status", "skipped");
                        result.put("reason", "No existing theory_of_change data to classify");
                        results.add(result);
                        return;
                      }
                      updatedData = theoryOfChangeService.addAbcClassificationOnly(
                          existingData, company.getCompanyUrl());
                    } else {
                      updatedData = theoryOfChangeService.execute(existingData, company.getCompanyUrl());
                    }

                    String updatedJsonString = objectMapper.writeValueAsString(updatedData);
                    companyExtractionDataService.saveExtractionData(
                        company.getCompanyUrl(), updatedJsonString
                    );

                    JsonNode theoryOfChange = updatedData.get("theory_of_change");
                    int impactAreas = theoryOfChange != null && theoryOfChange.isArray()
                        ? theoryOfChange.size() : 0;

                    result.put("status", "success");
                    result.put("impact_areas_count", impactAreas);
                    result.put("positive_impact_areas", updatedData.path("positive_impact_areas_count").asInt());
                    result.put("negative_impact_areas", updatedData.path("negative_impact_areas_count").asInt());
                    result.put("impact_magnitude", updatedData.path("impact_magnitude_5_year").asDouble());
                    result.put("impact_likelihood", updatedData.path("impact_likelihood").asDouble());
                    result.put("overall_impact_score", updatedData.path("overall_impact_potential_score").asDouble());

                    if (finalAbcOnly) {
                      result.put("abc_refreshed", true);
                    }

                    log.info("Successfully processed Theory of Change{} with {} impact areas for {}",
                             finalAbcOnly ? " (ABC-only)" : "", impactAreas, company.getCompanyName());
                    successCount.incrementAndGet();

                  } catch (Exception e) {
                    log.error("Failed to process Theory of Change for company {}: {}",
                             company.getCompanyUrl(), e.getMessage());
                    result.put("status", "error");
                    result.put("error", e.getMessage());
                    failureCount.incrementAndGet();
                  }

                  results.add(result);
                }, executor))
                .collect(Collectors.toList());

            // Wait for all futures in this batch to complete before moving to next batch
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
          }

          if (finalLimit != null && finalLimit > 0 && processedCount.get() >= finalLimit) {
            break;
          }

          if (!batch.hasNext()) {
            break;
          }

          page++;
        }
      } finally {
        executor.shutdown();
      }

      if (dryRun) {
        return ResponseEntity.ok(Map.of(
            "dryRun", true,
            "message", "Would process " + processedCount.get() + " companies",
            "companies", new ArrayList<>(results)
        ));
      }

      if (successCount.get() > 0) {
        metricsCacheService.invalidateCache();
        log.info("Invalidated metrics cache after Theory of Change update");
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", processedCount.get());
      response.put("success_count", successCount.get());
      response.put("failure_count", failureCount.get());
      response.put("skipped_already_updated", skippedCount.get());
      response.put("results", new ArrayList<>(results));
      response.put("abc_only", abcOnly);
      response.put("limit", limit);
      response.put("skip_updated_since", skipUpdatedSince);
      response.put("parallel_threads", PARALLEL_PROCESSING_THREADS);

      log.info("=== THEORY OF CHANGE RERUN COMPLETED (streamed): {}/{} successful, {} skipped (parallel with {} threads) ===",
               successCount.get(), processedCount.get(), skippedCount.get(), PARALLEL_PROCESSING_THREADS);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error during Theory of Change rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Theory of Change rerun failed: " + e.getMessage())
      );
    }
  }

  private ResponseEntity<Map<String, Object>> processTheoryOfChangeBatch(
      List<CompanyExtractionData> companiesToProcess,
      boolean dryRun,
      boolean abcOnly,
      Integer limit) {

    if (companiesToProcess == null) {
      companiesToProcess = new ArrayList<>();
    }

    if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
      companiesToProcess = companiesToProcess.subList(0, limit);
    }

    if (dryRun) {
      List<Map<String, Object>> preview = companiesToProcess.stream()
          .map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("name", c.getCompanyName() != null ? c.getCompanyName() : "Unknown");
            item.put("url", c.getCompanyUrl());
            JsonNode data = c.getRawExtractionData() != null
                ? objectMapper.valueToTree(c.getRawExtractionData())
                : null;
            boolean hasToC = data != null && data.has("theory_of_change")
                && data.get("theory_of_change").isArray()
                && data.get("theory_of_change").size() > 0;
            item.put("hasTheoryOfChange", hasToC);
            if (hasToC) {
              item.put("impactAreasCount", data.get("theory_of_change").size());
            }
            return item;
          })
          .collect(Collectors.toList());

      return ResponseEntity.ok(Map.of(
          "dryRun", true,
          "message", "Would process " + companiesToProcess.size() + " companies",
          "companies", preview
      ));
    }

    // Thread-safe collections for parallel processing
    ConcurrentLinkedQueue<Map<String, Object>> results = new ConcurrentLinkedQueue<>();
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger failureCount = new AtomicInteger(0);

    // Create thread pool for parallel processing
    ExecutorService executor = Executors.newFixedThreadPool(PARALLEL_PROCESSING_THREADS);
    final boolean finalAbcOnly = abcOnly;

    log.info("Processing {} companies in parallel with {} threads",
             companiesToProcess.size(), PARALLEL_PROCESSING_THREADS);

    try {
      // Submit all companies for parallel processing
      List<CompletableFuture<Void>> futures = companiesToProcess.stream()
          .map(company -> CompletableFuture.runAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            result.put("company_id", company.getId());
            result.put("company_name", company.getCompanyName());
            result.put("company_url", company.getCompanyUrl());

            try {
              log.info("Processing Theory of Change{} for company: {} (ID: {})",
                       finalAbcOnly ? " (ABC-only)" : "", company.getCompanyName(), company.getId());

              JsonNode existingData = objectMapper.readTree(
                  objectMapper.writeValueAsString(company.getRawExtractionData())
              );

              JsonNode updatedData;
              if (finalAbcOnly) {
                JsonNode tocNode = existingData.get("theory_of_change");
                if (tocNode == null || !tocNode.isArray() || tocNode.size() == 0) {
                  result.put("status", "skipped");
                  result.put("reason", "No existing theory_of_change data to classify");
                  results.add(result);
                  return;
                }
                updatedData = theoryOfChangeService.addAbcClassificationOnly(
                    existingData, company.getCompanyUrl());
              } else {
                updatedData = theoryOfChangeService.execute(existingData, company.getCompanyUrl());
              }

              String updatedJsonString = objectMapper.writeValueAsString(updatedData);
              companyExtractionDataService.saveExtractionData(
                  company.getCompanyUrl(), updatedJsonString
              );

              JsonNode theoryOfChange = updatedData.get("theory_of_change");
              int impactAreas = theoryOfChange != null && theoryOfChange.isArray()
                  ? theoryOfChange.size() : 0;

              result.put("status", "success");
              result.put("impact_areas_count", impactAreas);
              result.put("positive_impact_areas", updatedData.path("positive_impact_areas_count").asInt());
              result.put("negative_impact_areas", updatedData.path("negative_impact_areas_count").asInt());
              result.put("impact_magnitude", updatedData.path("impact_magnitude_5_year").asDouble());
              result.put("impact_likelihood", updatedData.path("impact_likelihood").asDouble());
              result.put("overall_impact_score", updatedData.path("overall_impact_potential_score").asDouble());

              if (finalAbcOnly) {
                result.put("abc_refreshed", true);
              }

              log.info("Successfully processed Theory of Change{} with {} impact areas for {}",
                       finalAbcOnly ? " (ABC-only)" : "", impactAreas, company.getCompanyName());
              successCount.incrementAndGet();

            } catch (Exception e) {
              log.error("Failed to process Theory of Change for company {}: {}",
                       company.getCompanyUrl(), e.getMessage());
              result.put("status", "error");
              result.put("error", e.getMessage());
              failureCount.incrementAndGet();
            }

            results.add(result);
          }, executor))
          .collect(Collectors.toList());

      // Wait for all futures to complete
      CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

    } finally {
      executor.shutdown();
    }

    if (successCount.get() > 0) {
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after Theory of Change update");
    }

    Map<String, Object> response = new HashMap<>();
    response.put("total_processed", companiesToProcess.size());
    response.put("success_count", successCount.get());
    response.put("failure_count", failureCount.get());
    response.put("results", new ArrayList<>(results));
    response.put("abc_only", abcOnly);
    response.put("limit", limit);
    response.put("parallel_threads", PARALLEL_PROCESSING_THREADS);

    log.info("=== THEORY OF CHANGE RERUN COMPLETED (explicit IDs): {}/{} successful (parallel with {} threads) ===",
             successCount.get(), companiesToProcess.size(), PARALLEL_PROCESSING_THREADS);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/rerun-esg-foresight")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunEsgForesightScores(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING ESG FORESIGHT SCORES RERUN ===");

      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      boolean force = false;

      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }

        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }

        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }

        if (params.containsKey("force")) {
          force = (Boolean) params.get("force");
        }
      }

      log.info("Rerun parameters - Company IDs: {}, Limit: {}, Dry run: {}, Force: {}",
               companyIds, limit, dryRun, force);

      // Find companies that need rerun
      List<CompanyExtractionData> companiesToProcess;

      if (companyIds != null && !companyIds.isEmpty()) {
        // Specific companies
        companiesToProcess = companyExtractionDataRepository.findAllById(companyIds);
        log.info("Found {} companies from provided IDs", companiesToProcess.size());
      } else if (!force) {
        // Find companies without foresight scores
        Stream<CompanyExtractionData> stream = companyExtractionDataRepository.findAll().stream()
            .filter(c -> c.getEsgRiskTotalForesight() == null || c.getEsgRiskTotalForesight().doubleValue() == 0);
        if (limit != null && limit > 0) {
          stream = stream.limit(limit);
        }
        companiesToProcess = stream.collect(Collectors.toList());
        log.info("Found {} companies without foresight scores", companiesToProcess.size());
      } else {
        // Force rerun all (limited if specified)
        Stream<CompanyExtractionData> stream = companyExtractionDataRepository.findAll().stream();
        if (limit != null && limit > 0) {
          stream = stream.limit(limit);
        }
        companiesToProcess = stream.collect(Collectors.toList());
        log.info("Force rerunning {} companies", companiesToProcess.size());
      }

      if (dryRun) {
        List<Map<String, Object>> preview = companiesToProcess.stream()
            .map(c -> {
              Map<String, Object> item = new HashMap<>();
              item.put("id", c.getId());
              item.put("name", c.getCompanyName() != null ? c.getCompanyName() : "Unknown");
              item.put("domain", c.getDomain() != null ? c.getDomain() : "Unknown");
              item.put("currentForesightScore", c.getEsgRiskTotalForesight() != null ? c.getEsgRiskTotalForesight() : 0);
              return item;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "dryRun", true,
            "message", "Would process " + companiesToProcess.size() + " companies",
            "companies", preview
        ));
      }

      // Process companies
      Map<String, Object> results = new HashMap<>();
      List<Map<String, Object>> processed = new ArrayList<>();
      List<Map<String, Object>> errors = new ArrayList<>();

      for (CompanyExtractionData company : companiesToProcess) {
        try {
          log.info("Processing company: {} (ID: {})", company.getCompanyName(), company.getId());

          // Convert to JsonNode
          JsonNode companyData = objectMapper.valueToTree(company.getRawExtractionData());

          // Run Phase 11 - ESG Foresight Score
          JsonNode result = esgForesightScoreService.execute(companyData, company.getDomain());

          // Log what we got back to debug
          log.info("Foresight result keys: {}", result.fieldNames());

          // Update scores
          if (result.has("esg_risk_environmental_foresight")) {
            company.setEsgRiskEnvironmentalForesight(
                BigDecimal.valueOf(result.get("esg_risk_environmental_foresight").asDouble()));
          }
          if (result.has("esg_risk_social_foresight")) {
            company.setEsgRiskSocialForesight(
                BigDecimal.valueOf(result.get("esg_risk_social_foresight").asDouble()));
          }
          if (result.has("esg_risk_governance_foresight")) {
            company.setEsgRiskGovernanceForesight(
                BigDecimal.valueOf(result.get("esg_risk_governance_foresight").asDouble()));
          }
          if (result.has("esg_risk_total_foresight")) {
            company.setEsgRiskTotalForesight(
                BigDecimal.valueOf(result.get("esg_risk_total_foresight").asDouble()));
          }

          // Update large-cap flags
          if (result.has("is_large_cap_mode")) {
            company.setIsLargeCapMode(result.get("is_large_cap_mode").asBoolean());
          }
          if (result.has("large_cap_threshold_reason")) {
            company.setLargeCapThresholdReason(result.get("large_cap_threshold_reason").asText());
          }
          if (result.has("esg_foresight_qualified")) {
            company.setEsgForesightQualified(result.get("esg_foresight_qualified").asBoolean());
          }

          // Update raw extraction data with foresight details
          Map<String, Object> rawData = company.getRawExtractionData();
          if (rawData == null) {
            rawData = new HashMap<>();
          }

          // Store ALL foresight details in raw data (including explanations, drivers, HSRIs, etc.)
          final Map<String, Object> finalRawData = rawData;
          result.fields().forEachRemaining(field -> {
            String key = field.getKey();
            // Store all foresight-related fields including the _data fields with explanations
            if (key.contains("foresight") || key.endsWith("_foresight_data") ||
                key.equals("is_large_cap_mode") || key.equals("large_cap_threshold_reason")) {
              finalRawData.put(key, objectMapper.convertValue(field.getValue(), Object.class));
            }
          });

          company.setRawExtractionData(finalRawData);

          // Save
          companyExtractionDataRepository.save(company);

          processed.add(Map.of(
              "id", company.getId(),
              "name", company.getCompanyName() != null ? company.getCompanyName() : "Unknown",
              "environmental", company.getEsgRiskEnvironmentalForesight(),
              "social", company.getEsgRiskSocialForesight(),
              "governance", company.getEsgRiskGovernanceForesight(),
              "total", company.getEsgRiskTotalForesight(),
              "isLargeCap", company.getIsLargeCapMode() != null ? company.getIsLargeCapMode() : false
          ));

        } catch (Exception e) {
          log.error("Error processing company {}: {}", company.getId(), e.getMessage());
          errors.add(Map.of(
              "id", company.getId(),
              "name", company.getCompanyName() != null ? company.getCompanyName() : "Unknown",
              "error", e.getMessage()
          ));
        }
      }

      results.put("processed", processed.size());
      results.put("errors", errors.size());
      results.put("processedCompanies", processed);
      results.put("errorCompanies", errors);

      log.info("=== ESG FORESIGHT SCORES RERUN COMPLETE ===");
      log.info("Processed: {}, Errors: {}", processed.size(), errors.size());

      return ResponseEntity.ok(results);

    } catch (Exception e) {
      log.error("Error in ESG Foresight rerun", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "ESG Foresight rerun failed: " + e.getMessage())
      );
    }
  }

  /**
   * Add standardized ESG topic mappings to existing personalized topics.
   * This endpoint only adds the standardized_topic field without regenerating topics.
   */
  @PostMapping("/add-esg-standardized-mappings")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> addEsgStandardizedMappings(
      @RequestBody final Map<String, Object> params) {
    try {
      log.info("=== STARTING ESG STANDARDIZED MAPPING ADDITION ===");

      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;

      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }

        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }

        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
      }

      log.info("Parameters - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);

      // Find companies that need standardization
      List<CompanyExtractionData> companiesToProcess;

      if (companyIds != null && !companyIds.isEmpty()) {
        // Process specific companies
        companiesToProcess = companyExtractionDataRepository.findAllById(companyIds);
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        // Find companies with ESG topics but no standardization
        companiesToProcess = companyExtractionDataRepository.findAll().stream()
            .filter(company -> {
              Map<String, Object> rawData = company.getRawExtractionData();
              if (rawData == null) {
                return false;
              }

              // Check if has ESG topics
              Object esgAnalysis = rawData.get("esg_materiality_analysis");
              if (!(esgAnalysis instanceof Map)) {
                return false;
              }

              @SuppressWarnings("unchecked")
              Map<String, Object> esgMap = (Map<String, Object>) esgAnalysis;
              Object topics = esgMap.get("topics");
              if (!(topics instanceof List)) {
                return false;
              }

              @SuppressWarnings("unchecked")
              List<Map<String, Object>> topicsList = (List<Map<String, Object>>) topics;
              if (topicsList.isEmpty()) {
                return false;
              }

              // Check if first topic lacks standardized_topic field
              Map<String, Object> firstTopic = topicsList.get(0);
              return !firstTopic.containsKey("standardized_topic");
            })
            .collect(Collectors.toList());
        log.info("Found {} companies with ESG topics needing standardization", companiesToProcess.size());

        // Apply limit if specified
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }

      // Process results tracking
      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;
      int skippedCount = 0;

      // Process each company
      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> result = new HashMap<>();
        result.put("company_id", company.getId());
        result.put("company_name", company.getCompanyName());
        result.put("company_url", company.getCompanyUrl());

        try {
          if (dryRun) {
            // Dry run - just check what would be processed
            Map<String, Object> rawData = company.getRawExtractionData();
            boolean hasEsgTopics = false;
            boolean hasStandardization = false;

            if (rawData != null) {
              Object esgAnalysis = rawData.get("esg_materiality_analysis");
              if (esgAnalysis instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> esgMap = (Map<String, Object>) esgAnalysis;
                Object topics = esgMap.get("topics");
                if (topics instanceof List && !((List<?>) topics).isEmpty()) {
                  hasEsgTopics = true;
                  @SuppressWarnings("unchecked")
                  List<Map<String, Object>> topicsList = (List<Map<String, Object>>) topics;
                  Map<String, Object> firstTopic = topicsList.get(0);
                  hasStandardization = firstTopic.containsKey("standardized_topic");
                }
              }
            }

            result.put("status", "dry_run");
            result.put("has_esg_topics", hasEsgTopics);
            result.put("has_standardization", hasStandardization);
            result.put("message", "Would add standardized topic mappings");
          } else {
            // Load existing extraction data
            JsonNode existingData = objectMapper.readTree(
                objectMapper.writeValueAsString(company.getRawExtractionData())
            );

            // Add standardized topic mappings
            JsonNode updatedData = esgMaterialityService.addStandardizedTopicMappings(existingData, company.getCompanyUrl());

            if (updatedData == null || updatedData.equals(existingData)) {
              result.put("status", "skipped");
              result.put("message", "No topics to standardize or already standardized");
              skippedCount++;
            } else {
              // Update the company with standardized mappings
              @SuppressWarnings("unchecked")
              Map<String, Object> updatedRawData = objectMapper.convertValue(updatedData, Map.class);
              company.setRawExtractionData(updatedRawData);

              // Save to database
              companyExtractionDataRepository.save(company);

              result.put("status", "success");
              result.put("message", "Successfully added standardized topic mappings");
              successCount++;
            }
          }
        } catch (Exception e) {
          log.error("Error processing company {}: {}", company.getId(), e.getMessage());
          result.put("status", "error");
          result.put("message", e.getMessage());
          failureCount++;
        }

        results.add(result);
      }

      // Prepare response
      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("skipped_count", skippedCount);
      response.put("dry_run", dryRun);
      response.put("results", results);

      if (dryRun) {
        response.put("message", "Dry run completed - no data was saved");
      } else if (failureCount == 0 && skippedCount == 0) {
        response.put("message", "Standardized mappings added successfully");
      } else if (failureCount > 0) {
        response.put("message", String.format("Standardized mapping completed with %d failures", failureCount));
      } else {
        response.put("message", String.format("Standardized mapping completed (%d processed, %d skipped)",
            successCount, skippedCount));
      }

      log.info("=== ESG STANDARDIZED MAPPING COMPLETED ===");
      log.info("Processed: {}, Success: {}, Failures: {}, Skipped: {}",
               companiesToProcess.size(), successCount, failureCount, skippedCount);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error in ESG standardized mapping", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Standardized mapping failed: " + e.getMessage())
      );
    }
  }

  @PostMapping("/validate-company-url/{companyId}")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> validateCompanyUrl(
    @PathVariable final Long companyId) {
    try {
      log.info("Validating URL for company ID: {}", companyId);

      UrlValidationService.UrlCheckResult result =
        urlValidationService.validateAndCreateApprovalEvent(companyId);

      Map<String, Object> response = new HashMap<>();
      response.put("companyId", companyId);
      response.put("status", result.getStatus());
      response.put("currentUrl", result.getCurrentUrl());
      response.put("explanation", result.getExplanation());
      response.put("approvalEventCreated",
        result.shouldUpdateUrl() || result.hasIssue());

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error validating company URL", e);
      return ResponseEntity.internalServerError()
        .body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * Toggle news tracking for a company.
   *
   * @param companyId the company ID
   * @param enabled whether to enable or disable news tracking
   * @param user the current user
   * @return response with updated trackNews status
   */
  @PutMapping("/{companyId}/track-news")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, Object>> toggleNewsTracking(
    @PathVariable final Long companyId,
    @RequestParam final boolean enabled,
    @CurrentUser final User user) {
    try {
      log.info("User {} toggling news tracking for company {}: {}",
        user.getEmail(), companyId, enabled);

      CompanyExtractionData company =
        companyExtractionDataRepository.findById(companyId)
          .orElseThrow(() -> new RuntimeException("Company not found"));

      company.setTrackNews(enabled);
      companyExtractionDataRepository.save(company);

      log.info("News tracking {} for company {} ({})",
        enabled ? "enabled" : "disabled",
        companyId,
        company.getCompanyName());

      Map<String, Object> response = new HashMap<>();
      response.put("companyId", companyId);
      response.put("companyName", company.getCompanyName());
      response.put("trackNews", enabled);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error toggling news tracking for company {}", companyId, e);
      return ResponseEntity.internalServerError()
        .body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * Recalculate impact scoring aggregates for existing companies using the corrected
   * dashboard formula. This does NOT re-run AI generation - it only recalculates the
   * aggregate metrics (magnitude, likelihood, overall score) from existing impact_scoring data.
   *
   * Parameters:
   * - companyIds (optional): List of specific company IDs to process
   * - limit (optional): Maximum number of companies to process
   * - dryRun (optional): If true, show what would be processed without making changes
   */
  @PostMapping("/rerun-impact-scoring")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunImpactScoring(
      @RequestBody Map<String, Object> params) {
    try {
      log.info("=== STARTING IMPACT SCORING RECALCULATION ===");

      // Extract parameters
      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;

      if (params != null) {
        // Handle company IDs
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }

        if (params.containsKey("limit")) {
          limit = ((Number) params.get("limit")).intValue();
        }

        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
      }

      log.info("Impact scoring recalculation - Company IDs: {}, Limit: {}, Dry run: {}",
               companyIds, limit, dryRun);

      // Process specific IDs directly; otherwise stream in batches to keep memory bounded
      if (companyIds != null && !companyIds.isEmpty()) {
        List<CompanyExtractionData> companiesToProcess = companyExtractionDataRepository.findAllById(companyIds);
        if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
        }
        return processImpactScoringBatch(companiesToProcess, dryRun, limit);
      }

      // Stream in batches for memory efficiency
      int page = 0;
      int processedCount = 0;
      int successCount = 0;
      int skippedCount = 0;
      int failureCount = 0;
      List<Map<String, Object>> results = new ArrayList<>();

      while (true) {
        org.springframework.data.domain.Page<CompanyExtractionData> batch =
            companyExtractionDataRepository.findAll(
                PageRequest.of(page, RERUN_BATCH_SIZE, Sort.by(Sort.Direction.ASC, "id")));

        if (!batch.hasContent()) {
          break;
        }

        for (CompanyExtractionData company : batch.getContent()) {
          if (limit != null && limit > 0 && processedCount >= limit) {
            break;
          }

          JsonNode rawData = company.getRawExtractionData() != null
              ? objectMapper.valueToTree(company.getRawExtractionData())
              : null;

          // Check if company has impact_scoring data
          boolean hasScoring = rawData != null
              && rawData.has("impact_scoring")
              && rawData.get("impact_scoring").isArray()
              && rawData.get("impact_scoring").size() > 0;

          if (!hasScoring) {
            skippedCount++;
            continue;
          }

          processedCount++;

          if (dryRun) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", company.getId());
            item.put("name", company.getCompanyName() != null ? company.getCompanyName() : "Unknown");
            item.put("url", company.getCompanyUrl());
            item.put("hasImpactScoring", true);
            item.put("impactChainsCount", rawData.get("impact_scoring").size());
            item.put("currentScore", rawData.path("overall_impact_potential_score").asDouble(0));
            results.add(item);
            continue;
          }

          Map<String, Object> result = new HashMap<>();
          result.put("company_id", company.getId());
          result.put("company_name", company.getCompanyName());
          result.put("company_url", company.getCompanyUrl());

          try {
            // Capture old values for comparison
            double oldMagnitude = rawData.path("impact_magnitude_5_year").asDouble(0);
            double oldLikelihood = rawData.path("impact_likelihood").asDouble(0);
            double oldScore = rawData.path("overall_impact_potential_score").asDouble(0);

            log.info("Recalculating impact scoring for company: {} (ID: {})",
                     company.getCompanyName(), company.getId());

            // Recalculate using the corrected dashboard formula
            JsonNode updatedData = theoryOfChangeService.recalculateImpactScoring(
                rawData, company.getCompanyUrl());

            // Save updated data
            String updatedJsonString = objectMapper.writeValueAsString(updatedData);
            companyExtractionDataService.saveExtractionData(
                company.getCompanyUrl(), updatedJsonString
            );

            // Capture new values
            double newMagnitude = updatedData.path("impact_magnitude_5_year").asDouble(0);
            double newLikelihood = updatedData.path("impact_likelihood").asDouble(0);
            double newScore = updatedData.path("overall_impact_potential_score").asDouble(0);

            result.put("status", "success");
            result.put("old_magnitude", oldMagnitude);
            result.put("new_magnitude", newMagnitude);
            result.put("old_likelihood", oldLikelihood);
            result.put("new_likelihood", newLikelihood);
            result.put("old_score", oldScore);
            result.put("new_score", newScore);
            result.put("score_changed", Math.abs(oldScore - newScore) > 0.01);

            log.info("Recalculated impact scoring for {} - Score: {} -> {}",
                     company.getCompanyName(), oldScore, newScore);
            successCount++;

          } catch (Exception e) {
            log.error("Failed to recalculate impact scoring for company {}: {}",
                     company.getCompanyUrl(), e.getMessage());
            result.put("status", "error");
            result.put("error", e.getMessage());
            failureCount++;
          }

          results.add(result);
        }

        if (limit != null && limit > 0 && processedCount >= limit) {
          break;
        }

        if (!batch.hasNext()) {
          break;
        }

        page++;
      }

      if (dryRun) {
        return ResponseEntity.ok(Map.of(
            "dryRun", true,
            "message", "Would recalculate impact scoring for " + processedCount + " companies",
            "skipped_no_scoring", skippedCount,
            "companies", results
        ));
      }

      if (successCount > 0) {
        metricsCacheService.invalidateCache();
        log.info("Invalidated metrics cache after impact scoring recalculation");
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_with_scoring", processedCount);
      response.put("skipped_no_scoring", skippedCount);
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("results", results);
      response.put("limit", limit);

      log.info("=== IMPACT SCORING RECALCULATION COMPLETED: {}/{} successful ===",
               successCount, processedCount);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error during impact scoring recalculation", e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Impact scoring recalculation failed: " + e.getMessage())
      );
    }
  }

  /**
   * Helper method to process a batch of companies for impact scoring recalculation.
   */
  private ResponseEntity<Map<String, Object>> processImpactScoringBatch(
      List<CompanyExtractionData> companiesToProcess,
      boolean dryRun,
      Integer limit) {

    if (companiesToProcess == null) {
      companiesToProcess = new ArrayList<>();
    }

    if (limit != null && limit > 0 && companiesToProcess.size() > limit) {
      companiesToProcess = companiesToProcess.subList(0, limit);
    }

    // Filter to only companies with impact_scoring data
    List<CompanyExtractionData> companiesWithScoring = companiesToProcess.stream()
        .filter(c -> {
          JsonNode data = c.getRawExtractionData() != null
              ? objectMapper.valueToTree(c.getRawExtractionData())
              : null;
          return data != null && data.has("impact_scoring")
              && data.get("impact_scoring").isArray()
              && data.get("impact_scoring").size() > 0;
        })
        .collect(Collectors.toList());

    int skippedCount = companiesToProcess.size() - companiesWithScoring.size();

    if (dryRun) {
      List<Map<String, Object>> preview = companiesWithScoring.stream()
          .map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("name", c.getCompanyName() != null ? c.getCompanyName() : "Unknown");
            item.put("url", c.getCompanyUrl());
            JsonNode data = objectMapper.valueToTree(c.getRawExtractionData());
            item.put("impactChainsCount", data.get("impact_scoring").size());
            item.put("currentScore", data.path("overall_impact_potential_score").asDouble(0));
            return item;
          })
          .collect(Collectors.toList());

      return ResponseEntity.ok(Map.of(
          "dryRun", true,
          "message", "Would recalculate impact scoring for " + companiesWithScoring.size() + " companies",
          "skipped_no_scoring", skippedCount,
          "companies", preview
      ));
    }

    List<Map<String, Object>> results = new ArrayList<>();
    int successCount = 0;
    int failureCount = 0;

    for (CompanyExtractionData company : companiesWithScoring) {
      Map<String, Object> result = new HashMap<>();
      result.put("company_id", company.getId());
      result.put("company_name", company.getCompanyName());
      result.put("company_url", company.getCompanyUrl());

      try {
        JsonNode rawData = objectMapper.valueToTree(company.getRawExtractionData());

        // Capture old values for comparison
        double oldMagnitude = rawData.path("impact_magnitude_5_year").asDouble(0);
        double oldLikelihood = rawData.path("impact_likelihood").asDouble(0);
        double oldScore = rawData.path("overall_impact_potential_score").asDouble(0);

        log.info("Recalculating impact scoring for company: {} (ID: {})",
                 company.getCompanyName(), company.getId());

        // Recalculate using the corrected dashboard formula
        JsonNode updatedData = theoryOfChangeService.recalculateImpactScoring(
            rawData, company.getCompanyUrl());

        // Save updated data
        String updatedJsonString = objectMapper.writeValueAsString(updatedData);
        companyExtractionDataService.saveExtractionData(
            company.getCompanyUrl(), updatedJsonString
        );

        // Capture new values
        double newMagnitude = updatedData.path("impact_magnitude_5_year").asDouble(0);
        double newLikelihood = updatedData.path("impact_likelihood").asDouble(0);
        double newScore = updatedData.path("overall_impact_potential_score").asDouble(0);

        result.put("status", "success");
        result.put("old_magnitude", oldMagnitude);
        result.put("new_magnitude", newMagnitude);
        result.put("old_likelihood", oldLikelihood);
        result.put("new_likelihood", newLikelihood);
        result.put("old_score", oldScore);
        result.put("new_score", newScore);
        result.put("score_changed", Math.abs(oldScore - newScore) > 0.01);

        log.info("Recalculated impact scoring for {} - Score: {} -> {}",
                 company.getCompanyName(), oldScore, newScore);
        successCount++;

      } catch (Exception e) {
        log.error("Failed to recalculate impact scoring for company {}: {}",
                 company.getCompanyUrl(), e.getMessage());
        result.put("status", "error");
        result.put("error", e.getMessage());
        failureCount++;
      }

      results.add(result);
    }

    if (successCount > 0) {
      metricsCacheService.invalidateCache();
      log.info("Invalidated metrics cache after impact scoring recalculation");
    }

    Map<String, Object> response = new HashMap<>();
    response.put("total_with_scoring", companiesWithScoring.size());
    response.put("skipped_no_scoring", skippedCount);
    response.put("success_count", successCount);
    response.put("failure_count", failureCount);
    response.put("results", results);
    response.put("limit", limit);

    log.info("=== IMPACT SCORING RECALCULATION COMPLETED (explicit IDs): {}/{} successful ===",
             successCount, companiesWithScoring.size());

    return ResponseEntity.ok(response);
  }

  @PostMapping("/rerun-fintech")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> rerunFintechClassification(
      @RequestBody final Map<String, Object> params) {
    try {
      log.info("=== STARTING FINTECH CLASSIFICATION BACKFILL ===");

      List<Long> companyIds = null;
      Integer limit = null;
      boolean dryRun = false;
      boolean force = false;

      if (params != null) {
        if (params.containsKey("companyIds") && params.get("companyIds") != null) {
          Object ids = params.get("companyIds");
          if (ids instanceof List) {
            companyIds = ((List<?>) ids).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
          }
        }
        if (params.containsKey("limit") && params.get("limit") != null) {
          limit = ((Number) params.get("limit")).intValue();
        }
        if (params.containsKey("dryRun")) {
          dryRun = (Boolean) params.get("dryRun");
        }
        if (params.containsKey("force")) {
          force = (Boolean) params.get("force");
        }
      }

      log.info("Backfill parameters - IDs: {}, Limit: {}, dryRun: {}, force: {}",
               companyIds, limit, dryRun, force);

      List<CompanyExtractionData> companiesToProcess;

      if (companyIds != null && !companyIds.isEmpty()) {
        companiesToProcess = new ArrayList<>();
        for (Long id : companyIds) {
          companyExtractionDataRepository.findById(id)
              .ifPresent(companiesToProcess::add);
        }
        log.info("Processing {} specific companies", companiesToProcess.size());
      } else {
        if (force) {
          companiesToProcess = companyExtractionDataRepository.findAll();
          log.info("Force mode: processing all {} companies",
                   companiesToProcess.size());
        } else {
          companiesToProcess = companyExtractionDataRepository.findAll().stream()
              .filter(c -> c.getIsFintech() == null)
              .collect(Collectors.toList());
          log.info("Found {} companies missing FinTech classification",
                   companiesToProcess.size());
        }

        if (limit != null && limit > 0
            && companiesToProcess.size() > limit) {
          companiesToProcess = companiesToProcess.subList(0, limit);
          log.info("Limited to {} companies", limit);
        }
      }

      if (dryRun) {
        List<Map<String, Object>> preview = companiesToProcess.stream()
            .limit(20)
            .map(c -> {
              Map<String, Object> item = new HashMap<>();
              item.put("id", c.getId());
              item.put("name", c.getCompanyName());
              item.put("url", c.getCompanyUrl());
              item.put("current_is_fintech", c.getIsFintech());
              return item;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "dryRun", true,
            "message", "Would classify " + companiesToProcess.size()
                + " companies for FinTech",
            "preview", preview
        ));
      }

      List<Map<String, Object>> results = new ArrayList<>();
      int successCount = 0;
      int failureCount = 0;

      for (CompanyExtractionData company : companiesToProcess) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", company.getId());
        result.put("company_name", company.getCompanyName());
        result.put("company_url", company.getCompanyUrl());

        try {
          log.info("Processing FinTech classification for: {} (ID: {})",
                   company.getCompanyName(), company.getId());

          Map<String, Object> rawData = company.getRawExtractionData();
          if (rawData == null) {
            rawData = new HashMap<>();
          }

          JsonNode companyData = objectMapper.valueToTree(rawData);
          JsonNode updatedData = fintechClassificationService.execute(
              companyData, company.getCompanyUrl());

          Boolean isFintech = updatedData.path("is_fintech").asBoolean(false);
          int confidenceScore = updatedData.path("fintech_confidence_score")
              .asInt(0);
          String explanation = updatedData.path("fintech_explanation")
              .asText("");

          company.setIsFintech(isFintech);
          company.setFintechConfidenceScore(BigDecimal.valueOf(confidenceScore));
          company.setFintechExplanation(explanation);

          rawData.put("is_fintech", isFintech);
          rawData.put("fintech_confidence_score", confidenceScore);
          rawData.put("fintech_explanation", explanation);
          company.setRawExtractionData(rawData);

          companyExtractionDataRepository.save(company);

          result.put("status", "success");
          result.put("is_fintech", isFintech);
          result.put("fintech_confidence_score", confidenceScore);
          result.put("fintech_explanation", explanation);

          log.info("FinTech classification for {}: isFintech={}, confidence={}%",
                   company.getCompanyName(), isFintech, confidenceScore);
          successCount++;

        } catch (Exception e) {
          log.error("Failed to classify FinTech for {}: {}",
                   company.getCompanyUrl(), e.getMessage());
          result.put("status", "error");
          result.put("error", e.getMessage());
          failureCount++;
        }

        results.add(result);
      }

      if (successCount > 0) {
        metricsCacheService.invalidateCache();
        log.info("Invalidated metrics cache after FinTech backfill");
      }

      Map<String, Object> response = new HashMap<>();
      response.put("total_processed", companiesToProcess.size());
      response.put("success_count", successCount);
      response.put("failure_count", failureCount);
      response.put("results", results);

      log.info("=== FINTECH CLASSIFICATION BACKFILL COMPLETED: {}/{} ===",
               successCount, companiesToProcess.size());

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error in FinTech classification backfill", e);
      return ResponseEntity.badRequest().body(
          Map.of("error", "Backfill failed: " + e.getMessage())
      );
    }
  }

  /**
   * Get note for a company within a portfolio.
   *
   * @param companyId Company extraction data ID
   * @param portfolioId Portfolio ID
   * @return Note content or null if not found
   */
  @GetMapping("/{companyId}/notes")
  @PreAuthorize("isSuperAdmin() or isPortfolioMember(null, #portfolioId)")
  public ResponseEntity<Map<String, Object>> getCompanyNote(
      @PathVariable final Long companyId,
      @RequestParam final Long portfolioId) {
    try {
      log.info("Fetching note for company {} in portfolio {}",
          companyId, portfolioId);
      String content = companyNoteService.getNote(companyId, portfolioId);
      return ResponseEntity.ok(Map.of(
          "company_id", companyId,
          "portfolio_id", portfolioId,
          "content", content != null ? content : ""
      ));
    } catch (Exception e) {
      log.error("Error fetching note for company {}: {}",
          companyId, e.getMessage());
      return ResponseEntity.badRequest().body(
          Map.of("error", e.getMessage())
      );
    }
  }

  /**
   * Save or update a note for a company within a portfolio.
   *
   * @param companyId Company extraction data ID
   * @param portfolioId Portfolio ID
   * @param request Request body with content field
   * @return Updated note content
   */
  @PutMapping("/{companyId}/notes")
  @PreAuthorize("isSuperAdmin() or isPortfolioMember(null, #portfolioId)")
  public ResponseEntity<Map<String, Object>> saveCompanyNote(
      @PathVariable final Long companyId,
      @RequestParam final Long portfolioId,
      @RequestBody final Map<String, String> request) {
    try {
      String content = request.get("content");
      log.info("Saving note for company {} in portfolio {}",
          companyId, portfolioId);
      companyNoteService.saveNote(companyId, portfolioId, content);
      return ResponseEntity.ok(Map.of(
          "company_id", companyId,
          "portfolio_id", portfolioId,
          "content", content != null ? content : "",
          "success", true
      ));
    } catch (Exception e) {
      log.error("Error saving note for company {}: {}",
          companyId, e.getMessage());
      return ResponseEntity.badRequest().body(
          Map.of("error", e.getMessage())
      );
    }
  }

  /**
   * Delete a note for a company within a portfolio.
   *
   * @param companyId Company extraction data ID
   * @param portfolioId Portfolio ID
   * @return Success response
   */
  @DeleteMapping("/{companyId}/notes")
  @PreAuthorize("isSuperAdmin() or isPortfolioMember(null, #portfolioId)")
  public ResponseEntity<Map<String, Object>> deleteCompanyNote(
      @PathVariable final Long companyId,
      @RequestParam final Long portfolioId) {
    try {
      log.info("Deleting note for company {} in portfolio {}",
          companyId, portfolioId);
      companyNoteService.deleteNote(companyId, portfolioId);
      return ResponseEntity.ok(Map.of(
          "company_id", companyId,
          "portfolio_id", portfolioId,
          "success", true
      ));
    } catch (Exception e) {
      log.error("Error deleting note for company {}: {}",
          companyId, e.getMessage());
      return ResponseEntity.badRequest().body(
          Map.of("error", e.getMessage())
      );
    }
  }
}
