package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.ImpactRequest;
import io.ventureplatform.dto.request.VentureRequest;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.ImpactFacade;
import io.ventureplatform.facade.VentureFacade;
import io.ventureplatform.service.VentureService;
import io.ventureplatform.service.external.ImpactAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.HashMap;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/pitch")
@RequiredArgsConstructor
public class PitchDeckController {
  private final VentureFacade ventureFacade;
  private final ImpactFacade impactFacade;
  private final VentureService ventureService;
  private final ImpactAiService impactAiService;

  @GetMapping("{uuid}")
  public ResponseEntity<VentureResponse> getPitchVenture(@PathVariable String uuid) {
    return ResponseEntity.ok(ventureFacade.getPitchVenture(uuid, false));
  }

  @GetMapping("{id}/auth")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND proSubscription(#venture.id)")
  public ResponseEntity<VentureResponse> getPitchVentureAuth(@PathVariable(name = "id") Venture venture) {
    return ResponseEntity.ok(ventureFacade.getPitchVenture(venture.getPitchSettings().getPitchId(), true));
  }

  @PostMapping("ventures/{ventureId}")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND proSubscription(#venture.id)")
  public void generatePitchDeck(@PathVariable(name = "ventureId") Venture venture) {
    ventureService.generatePitchDeck(venture);
  }

  @PutMapping("/ventures/{ventureId}/settings")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id) "
    + "AND proSubscription(#venture.id)")
  public void updatePitchSettings(
    @RequestParam(required = false) String slide,
    @RequestParam(required = false) Long impactId,
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody @Valid VentureRequest request
  ) {
    ventureService.updatePitchSettings(venture, ventureFacade.dtoToEntity(request), slide, impactId);
  }

  @PutMapping("/ventures/{ventureId}/share")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id) "
    + "AND proSubscription(#venture.id)")
  public void updatePitchVisibility(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody HashMap<String, Boolean> body
  ) {
    ventureService.updatePitchVisibility(venture, body);
  }

  @PutMapping("/ventures/{ventureId}/regenerate")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<String> regenerateGptText(
    @RequestParam String name,
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody(required = false) ImpactRequest impact
  ) {
    return ResponseEntity.ok(impactAiService.regenerateText(venture, name, impactFacade.dtoToEntity(impact)));
  }
}
