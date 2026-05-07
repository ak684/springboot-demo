package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.ImpactScoreRequest;
import io.ventureplatform.dto.response.ImpactScoreResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.facade.ImpactScoreFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/scoring")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ImpactScoreController {
  private final ImpactScoreFacade scoreFacade;

  @PostMapping("{impactId}")
  @PreAuthorize("isMember(#impact.venture.organization.id, #impact.venture.id) AND editAllowed(#impact.venture.id)")
  public ResponseEntity<ImpactScoreResponse> scoreImpact(
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid ImpactScoreRequest request
  ) {
    return ResponseEntity.ok(scoreFacade.getScore(request, impact));
  }

  @GetMapping("improvement/{impactId}")
  @PreAuthorize("isMember(#impact.venture.organization.id, #impact.venture.id)")
  public ResponseEntity<Map<String, Double>> getImprovementPotential(
    @PathVariable(name = "impactId") Impact impact
  ) {
    return ResponseEntity.ok(scoreFacade.getImprovementPotential(impact));
  }
}
