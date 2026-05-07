package io.ventureplatform.controller;

import io.ventureplatform.dto.request.ImpactExportRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.PdfService;
import io.ventureplatform.service.external.GoogleService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ReportController {
  private final PdfService pdfService;
  private final GoogleService googleService;

  @PostMapping("ventures/{ventureId}/impacts")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<InputStreamResource> exportImpacts(
    @PathVariable(name = "ventureId") Venture venture,
    @Valid @RequestBody ImpactExportRequest request
  ) {
    return pdfService.generateImpactsExport(venture, request);
  }

  @GetMapping("ventures/{ventureId}/google")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<List<String>> downloadGoogleSlide(
    @PathVariable(name = "ventureId") Venture venture, @CurrentUser User user
  ) {
    return ResponseEntity.ok(googleService.prepareSpreadsheetAndSlide(venture, user));
  }
}
