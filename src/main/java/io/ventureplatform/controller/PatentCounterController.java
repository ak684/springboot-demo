package io.ventureplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.PatentCountModel;
import io.ventureplatform.dto.response.PatentTimelineEntry;
import io.ventureplatform.dto.request.PatentCountRequest;
import io.ventureplatform.service.PatentCounterService;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for patent counting functionality.
 */
@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/patents")
@RequiredArgsConstructor
@PreAuthorize("isSuperAdmin()")
@Slf4j
public class PatentCounterController {

  private final PatentCounterService patentCounterService;
  private final ObjectMapper objectMapper;

  /**
   * Endpoint to count patents for a company based on its URL.
   *
   * @param request The patent count request containing URL and EU-only flag
   * @return A PatentCountModel with the results
   */
  @PostMapping
  public ResponseEntity<PatentCountModel> countPatents(@RequestBody PatentCountRequest request) {
    log.info("Received request to count patents - URL: {}, Name: {}, EU only: {}, Grants only: {}, Save: {}", 
             request.getCompanyUrl(), request.getCompanyName(), request.isEuOnly(), request.isGrantsOnly(), 
             request.isSaveToDatabase());

    try {
      PatentCountModel result;
      
      // If company name is provided, skip OpenAI extraction and use it directly
      if (request.getCompanyName() != null && !request.getCompanyName().trim().isEmpty()) {
        log.info("Using provided company name: {}, saveToDatabase: {}", 
                 request.getCompanyName(), request.isSaveToDatabase());
        result = patentCounterService.countPatents(
            request.getCompanyName(), 
            request.getCompanyUrl() != null ? request.getCompanyUrl() : "", 
            request.isEuOnly(), 
            request.isGrantsOnly(), 
            false,  // countOnly = false to get full details
            request.isSaveToDatabase()); // Use the flag from the request
      } else {
        // Fall back to the original flow with OpenAI extraction
        log.info("No company name provided, using OpenAI extraction");
        result = patentCounterService.processCompanyUrl(
            request.getCompanyUrl(), request.isEuOnly(), request.isGrantsOnly(), 
            request.isSaveToDatabase()); // Use the flag from the request
      }
      
      log.info("Patent count result: {}", objectMapper.writeValueAsString(result));
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error counting patents: {}", e.getMessage(), e);
      PatentCountModel errorResult = PatentCountModel.builder()
              .companyName(request.getCompanyName() != null ? request.getCompanyName() : "Error")
              .patentCount(0)
              .grantedPatentCount(0)
              .applicationCount(0)
              .searchUrl("")
              .companyUrl(request.getCompanyUrl())
              .error("Error processing request: " + e.getMessage())
              .build();
      return ResponseEntity.ok(errorResult);
    }
  }
  
  /**
   * Get existing patents for a company from the database.
   *
   * @param companyId The company ID
   * @return PatentCountModel with saved patents
   */
  @GetMapping("/company/{companyId}")
  @PreAuthorize("canAccessCompany(#companyId)")
  public ResponseEntity<PatentCountModel> getCompanyPatents(@PathVariable Long companyId) {
    log.info("Fetching existing patents for company ID: {}", companyId);
    
    try {
      PatentCountModel result = patentCounterService.getExistingPatents(companyId);
      
      if (result != null) {
        log.info("Found {} existing patents for company ID: {}", result.getPatentCount(), companyId);
      } else {
        log.info("No existing patents found for company ID: {}", companyId);
      }
      
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error fetching patents for company {}: {}", companyId, e.getMessage());
      return ResponseEntity.ok(null);
    }
  }

  /**
   * Get a per-year patent activity timeline for a company. Excludes patents
   * whose filed_date can't be parsed into a year. Returns an empty list when
   * the company has no patents (frontend renders the existing empty state).
   *
   * @param companyId The company ID
   * @return Chronological list of per-year granted and application counts
   */
  @GetMapping("/company/{companyId}/timeline")
  @PreAuthorize("canAccessCompany(#companyId)")
  public ResponseEntity<List<PatentTimelineEntry>> getCompanyPatentTimeline(
      @PathVariable Long companyId) {
    log.info("Fetching patent timeline for company ID: {}", companyId);
    try {
      List<PatentTimelineEntry> timeline =
          patentCounterService.getPatentTimeline(companyId);
      return ResponseEntity.ok(timeline);
    } catch (Exception e) {
      log.error("Error building patent timeline for company {}: {}",
          companyId, e.getMessage());
      return ResponseEntity.ok(Collections.emptyList());
    }
  }
}
