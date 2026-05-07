package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.ScrapeService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/scrape")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ScrapeController {
  private final ScrapeService scrapeService;

  @PostMapping("address")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> getVentureAddress(@RequestBody String website) {
    return ResponseEntity.ok(scrapeService.getVentureAddress(website));
  }

  @PostMapping("logo")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<String> getVentureLogo(@RequestBody String twitter, @CurrentUser User user) {
    return ResponseEntity.ok(scrapeService.getVentureLogo(twitter, user));
  }

  @PostMapping("portfolio")
  @PreAuthorize("isSuperAdmin()")
  public ResponseEntity<Map<String, Object>> getPortfolioData(@RequestBody String website) throws IOException {
    return ResponseEntity.ok(scrapeService.getPortfolioManagerData(website));
  }
}
