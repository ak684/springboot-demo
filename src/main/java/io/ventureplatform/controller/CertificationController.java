package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.CertificationCriteriaResponse;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.CertificationService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/certifications")
@RequiredArgsConstructor
public class CertificationController {
  private final CertificationService certificationService;

  @GetMapping("{ventureId}/criteria")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public CertificationCriteriaResponse getCertificationCriteria(@PathVariable(name = "ventureId") Venture venture) {
    return certificationService.getCertificationCriteria(venture);
  }

  @PostMapping("{ventureId}/level/{level}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public void getCertificationForLevel(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable Integer level,
    @CurrentUser User user
  ) {
    certificationService.getCertificationForLevel(venture, level, user);
  }
}
