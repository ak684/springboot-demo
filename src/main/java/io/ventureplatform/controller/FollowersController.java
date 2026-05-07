package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.FollowersResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.FollowersFacade;
import io.ventureplatform.service.ScrapeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/followers")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FollowersController {
  private final FollowersFacade followersFacade;
  private final ScrapeService scrapeService;

  @PostMapping("social-media")
  public Map<String, String> getSocialMediaLinks(@RequestBody String website) {
    return scrapeService.getSocialMediaLinks(website);
  }

  @PostMapping("venture/{ventureId}/by-link")
  public Long getFollowers(@RequestBody Map<String, Object> body, @PathVariable(name = "ventureId") Venture venture) {
    return scrapeService.getFollowers(body, venture);
  }

  @PostMapping("portfolio/{portfolioId}/by-link")
  public Long getFollowers(@RequestBody Map<String, Object> body, @PathVariable(name = "portfolioId") Portfolio portfolio) {
    return scrapeService.getFollowers(body, portfolio);
  }

  @GetMapping("{ventureId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<List<FollowersResponse>> getFollowersHistory(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestParam(name = "days") Integer days
  ) {
    return ResponseEntity.ok(followersFacade.getTotalFollowers(venture, days));
  }
}
