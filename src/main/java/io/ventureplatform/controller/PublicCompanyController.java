package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.service.CompanyExtractionDataService;
import io.ventureplatform.service.translation.PublicProfileLanguage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public API endpoints for company data.
 * These endpoints do not require authentication and are used
 * for public-facing company profile pages.
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public/companies")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PublicCompanyController {

  private final CompanyExtractionDataService companyExtractionDataService;

  /**
   * Get public company profile by ID.
   * Returns company data for the public company overview page.
   *
   * @param id Company ID
   * @param portfolioId Optional portfolio ID for ranking context
   * @param language Requested language code ("en" or "de"),
   *                 defaults to "en" when omitted (#517).
   * @param mode Optional read mode. When "edit", the bilingual
   *             company_description is returned verbatim (no
   *             fallback) so the inline editor never echoes the
   *             other language as if it were a real translation
   *             (#517 editor-read rule).
   * @return Company profile data
   */
  @GetMapping("/{id}/profile")
  public ResponseEntity<Map<String, Object>> getPublicCompanyProfile(
      @PathVariable final Long id,
      @RequestParam(required = false) final Long portfolioId,
      @RequestParam(required = false) final String language,
      @RequestParam(required = false) final String mode) {
    try {
      PublicProfileLanguage parsedLang;
      try {
        parsedLang = PublicProfileLanguage.parse(language);
      } catch (IllegalArgumentException badLang) {
        return ResponseEntity.badRequest().body(
            Map.of("error", "Unsupported language: " + language));
      }
      boolean editorMode = "edit".equalsIgnoreCase(mode);
      log.info(
          "Fetching public company profile for ID: {} lang: {} mode: {}",
          id, parsedLang.getCode(), editorMode ? "edit" : "view");
      Map<String, Object> profile =
          companyExtractionDataService.getPublicCompanyProfile(
              id, portfolioId, parsedLang, editorMode);
      return ResponseEntity.ok(profile);
    } catch (IllegalArgumentException e) {
      log.warn("Company not found with ID: {}", id);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error fetching public company profile for ID: {}", id, e);
      return ResponseEntity.internalServerError().body(
          Map.of("error", "Failed to fetch company profile")
      );
    }
  }
}
