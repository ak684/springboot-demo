package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.AiTocFeedbackRequest;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.AiTocFacade;
import io.ventureplatform.service.AiTocService;
import io.ventureplatform.service.ScrapeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/ai-toc")
@RequiredArgsConstructor
public class AiTocController {
  private final AiTocFacade aiTocFacade;
  private final AiTocService aiTocService;
  private final ScrapeService scrapeService;

  @PostMapping("website-data")
  public ResponseEntity<String> getWebsiteContent(@RequestBody(required = false) String url) {
    return ResponseEntity.ok(scrapeService.getWebsiteData(url));
  }

  @PostMapping("feedback")
  public void createFeedback(@RequestBody @Valid AiTocFeedbackRequest feedback) {
    aiTocFacade.saveFeedback(feedback);
  }

  @PostMapping("1")
  public ResponseEntity<String> getTocData1(@RequestBody HashMap<String, String> data) throws IOException {
    return ResponseEntity.ok(aiTocService.getTocData1(data));
  }

  @PostMapping("2")
  public ResponseEntity<String> getTocData2(@RequestBody HashMap<String, Object> data, HttpServletRequest request)
    throws IOException {
    String result = aiTocService.getTocData2(data);
    aiTocService.saveUsage(request, "generate", result);
    return ResponseEntity.ok(result);
  }

  @PostMapping("3")
  public ResponseEntity<String> getTocData3(@RequestBody HashMap<String, Object> data, HttpServletRequest request)
    throws IOException {
    String result = aiTocService.getTocData3(data);
    aiTocService.saveUsage(request, "refine", result);
    return ResponseEntity.ok(result);
  }

  @GetMapping("stats")
  public ResponseEntity<Map<String, Object>> getTocStats() {
    return ResponseEntity.ok(aiTocService.getTocStats());
  }

  @GetMapping("countries")
  public ResponseEntity<Map<Long, String>> getTocCountryStats() {
    return ResponseEntity.ok(aiTocService.getTocCountryStats());
  }

  @PostMapping("{ventureId}/score")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public void aiScoreImpacts(@PathVariable(name = "ventureId") Venture venture, @RequestBody Set<Impact> impacts) {
    aiTocService.aiScoreImpacts(venture, impacts);
  }

  @GetMapping("daily")
  public ResponseEntity<Map<String, Object>> getDailyStats() {
    return ResponseEntity.ok(aiTocService.getDailyStats());
  }

  @GetMapping("daily-race")
  public ResponseEntity<Map<String, Object>> getDailyRace() {
    return ResponseEntity.ok(aiTocService.getDailyRaceStats());
  }
}
