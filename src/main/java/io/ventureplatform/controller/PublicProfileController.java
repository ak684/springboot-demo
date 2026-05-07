package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.GetPitchAccessRequest;
import io.ventureplatform.dto.request.PortfolioRequest;
import io.ventureplatform.dto.request.VentureRequest;
import io.ventureplatform.dto.response.PortfolioResponse;
import io.ventureplatform.dto.response.PortfolioVentureAccessResponse;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.PortfolioFacade;
import io.ventureplatform.facade.PortfolioVentureAccessFacade;
import io.ventureplatform.facade.VentureFacade;
import io.ventureplatform.service.PortfolioService;
import io.ventureplatform.service.PublicProfileService;
import io.ventureplatform.service.VentureService;
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
import java.util.List;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/public")
@RequiredArgsConstructor
// toDO: Harmonize names - public database vs. public profile
public class PublicProfileController {
  private final PublicProfileService publicProfileService;
  private final VentureFacade ventureFacade;
  private final VentureService ventureService;
  private final PortfolioFacade portfolioFacade;
  private final PortfolioService portfolioService;
  private final PortfolioVentureAccessFacade portfolioVentureAccessFacade;

  @PostMapping("pitch-access/ventures/{ventureId}")
  public void requestPitchAccess(
    @RequestBody @Valid GetPitchAccessRequest request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    publicProfileService.requestPitchAccess(request, venture);
  }

  @GetMapping("ventures")
  public ResponseEntity<List<VentureResponse>> getPublicVentures(@RequestParam(name = "days") Integer days) {
    return ResponseEntity.ok(ventureFacade.getPublicVentures(days));
  }

  @GetMapping("ventures/{id}")
  public ResponseEntity<VentureResponse> getPublicVenture(@PathVariable(name = "id") Venture venture) {
    return ResponseEntity.ok(ventureFacade.getPublicVenture(venture));
  }

  @PutMapping("/ventures/{ventureId}/settings")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id) "
    + "AND proSubscription(#venture.id)")
  public void updateVenturePublicSettings(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody @Valid VentureRequest request
  ) {
    ventureService.updatePublicProfileSettings(venture, ventureFacade.dtoToEntity(request));
  }

  @PutMapping("/ventures/{ventureId}/share")
  @PreAuthorize("isAuthenticated() AND isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id) "
    + "AND proSubscription(#venture.id)")
  public void updateVenturePublicVisibility(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody HashMap<String, Boolean> body
  ) {
    ventureService.updatePublicVisibility(venture, body);
  }

  @GetMapping("portfolios/{id}")
  public ResponseEntity<PortfolioResponse> getPublicPortfolio(@PathVariable(name = "id") Portfolio portfolio) {
    return ResponseEntity.ok(portfolioFacade.getPublicPortfolio(portfolio));
  }

  @GetMapping("portfolios/{id}/ventures")
  public ResponseEntity<List<VentureResponse>> getPublicPortfolioVentures(
    @PathVariable(name = "id") Portfolio portfolio,
    @RequestParam(name = "days") Integer days
  ) {
    return ResponseEntity.ok(ventureFacade.getPublicPortfolioVentures(portfolio, days));
  }

  @GetMapping("portfolios/{id}/ventures/all")
  @PreAuthorize("isAuthenticated() AND isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<PortfolioVentureAccessResponse>> getPublicPortfolioVenturesAll(
    @PathVariable(name = "id") Portfolio portfolio
  ) {
    return ResponseEntity.ok(portfolioVentureAccessFacade.getPublicPortfolioVenturesAll(portfolio));
  }

  @PutMapping("/portfolios/{portfolioId}/settings")
  @PreAuthorize("isAuthenticated() AND isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void updatePortfolioPublicSettings(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @RequestBody @Valid PortfolioRequest request
  ) {
    portfolioService.updatePublicProfileSettings(portfolio, portfolioFacade.dtoToEntity(request));
  }

  @PutMapping("/portfolios/{portfolioId}/share")
  @PreAuthorize("isAuthenticated() AND isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void updatePortfolioPublicVisibility(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @RequestBody HashMap<String, Boolean> body
  ) {
    portfolioService.updatePublicVisibility(portfolio, body);
  }
}
