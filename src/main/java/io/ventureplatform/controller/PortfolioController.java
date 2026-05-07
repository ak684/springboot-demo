package io.ventureplatform.controller;

import com.fasterxml.jackson.annotation.JsonView;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.InviteVentureRequest;
import io.ventureplatform.dto.request.PortfolioRequest;
import io.ventureplatform.dto.request.PortfolioVentureAccessRequest;
import io.ventureplatform.dto.request.TeamMemberRequest;
import io.ventureplatform.dto.response.PortfolioResponse;
import io.ventureplatform.dto.response.PortfolioVentureAccessResponse;
import io.ventureplatform.dto.response.TeamMemberResponse;
import io.ventureplatform.dto.response.Views;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.TeamMember;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.PortfolioFacade;
import io.ventureplatform.facade.PortfolioVentureAccessFacade;
import io.ventureplatform.facade.TeamMemberFacade;
import io.ventureplatform.service.PortfolioService;
import io.ventureplatform.service.TeamMemberService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/portfolios")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PortfolioController {
  private final PortfolioFacade portfolioFacade;
  private final PortfolioService portfolioService;
  private final TeamMemberFacade teamMemberFacade;
  private final TeamMemberService teamMemberService;
  private final PortfolioVentureAccessFacade portfolioVentureAccessFacade;

  @GetMapping
  @JsonView(Views.Basic.class)
  public ResponseEntity<List<PortfolioResponse>> getPortfolios(@CurrentUser User user) {
    return ResponseEntity.ok(portfolioFacade.findMyPortfolios(user));
  }

  @GetMapping("details")
  public ResponseEntity<List<PortfolioResponse>> getPortfoliosWithDetails(@CurrentUser User user) {
    return ResponseEntity.ok(portfolioFacade.findMyPortfolios(user));
  }

  @PutMapping("invitations/{portfolioId}/accept")
  public void acceptInvitation(@PathVariable(name = "portfolioId") Portfolio portfolio, @CurrentUser User user) {
    portfolioService.acceptInvitation(portfolio, user);
  }

  @PutMapping("invitations/{portfolioId}/decline")
  public void declineInvitation(@PathVariable(name = "portfolioId") Portfolio portfolio, @CurrentUser User user) {
    portfolioService.declineInvitation(portfolio, user);
  }

  @PostMapping
  public ResponseEntity<PortfolioResponse> createPortfolio(
    @CurrentUser User user,
    @RequestBody @Valid PortfolioRequest request
  ) {
    return ResponseEntity.ok(portfolioFacade.createPortfolio(user, request));
  }

  @PutMapping("{id}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<PortfolioResponse> editPortfolio(
    @PathVariable(name = "id") Portfolio portfolio,
    @RequestBody @Valid PortfolioRequest request
  ) {
    return ResponseEntity.ok(portfolioFacade.editPortfolio(portfolio, request));
  }

  @DeleteMapping("{id}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void deletePortfolio(@PathVariable(name = "id") Portfolio portfolio) {
    portfolioService.deleteById(portfolio.getId());
  }

  @GetMapping("{portfolioId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<PortfolioResponse> getPortfolio(@PathVariable(name = "portfolioId") Portfolio portfolio) {
    return ResponseEntity.ok(portfolioFacade.entityToDto(portfolio));
  }

  // Managing team members

  @PostMapping("{portfolioId}/team")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<TeamMemberResponse> addTeamMember(
    @RequestBody @Valid TeamMemberRequest request,
    @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    return ResponseEntity.ok(teamMemberFacade.addTeamMemberPortfolio(request, portfolio));
  }

  @PutMapping("{portfolioId}/team/{memberId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<TeamMemberResponse> editTeamMember(
    @RequestBody @Valid TeamMemberRequest request,
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @PathVariable(name = "memberId") TeamMember existing
  ) {
    return ResponseEntity.ok(teamMemberFacade.editTeamMember(request, existing));
  }

  @PutMapping("{portfolioId}/team/order")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void updateTeamMembersOrderAndType(
    @RequestBody @Valid List<TeamMemberRequest> request,
    @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    teamMemberService.updateTeamMembersOrderAndType(request);
  }

  @DeleteMapping("{portfolioId}/team/{memberId}")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void deleteTeamMember(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @PathVariable(name = "memberId") TeamMember teamMember
  ) {
    teamMemberService.deleteById(teamMember.getId());
  }

  @GetMapping("by-code/{code}")
  public ResponseEntity<PortfolioResponse> getPortfolioByInvitationCode(@PathVariable String code) {
    return ResponseEntity.ok(portfolioService.findByInvitationCode(code));
  }

  @GetMapping("by-venture/{ventureId}")
  public ResponseEntity<List<PortfolioResponse>> getPortfoliosByVenture(
    @PathVariable(name = "ventureId") Venture venture
  ) {
    return ResponseEntity.ok(portfolioService.getPortfoliosByVenture(venture));
  }

  // Managing venture access

  // toDO: Prepare short view of a venture to avoid sending all set of venture fields here (mainly impacts)
  @GetMapping("{portfolioId}/ventures")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public ResponseEntity<List<PortfolioVentureAccessResponse>> getPortfolioVentures(
    @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    return ResponseEntity.ok(portfolioVentureAccessFacade.getPortfolioVentures(portfolio));
  }

  @PutMapping("{portfolioId}/ventures/{ventureId}/unlink")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void unlinkVenture(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    portfolioService.unlinkVenture(portfolio, venture);
  }

  @PutMapping("{portfolioId}/ventures/{ventureId}/hide")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void toggleHideVenture(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    portfolioService.toggleHideVenture(portfolio, venture);
  }

  @PutMapping("{portfolioId}/ventures/{ventureId}/public-hide")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void toggleHidePublicVenture(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    portfolioService.toggleHidePublicVenture(portfolio, venture);
  }

  @PutMapping("{portfolioId}/ventures/public-hide/batch")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void batchHidePublicVentures(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @RequestBody List<PortfolioVentureAccessRequest> ventures
  ) {
    portfolioVentureAccessFacade.batchHidePublicVentures(ventures);
  }

  @PostMapping("{portfolioId}/ventures/invite")
  @PreAuthorize("isPortfolioMember(#portfolio.organization.id, #portfolio.id)")
  public void inviteNewVentures(
    @PathVariable(name = "portfolioId") Portfolio portfolio,
    @RequestBody @Valid InviteVentureRequest request
  ) {
    portfolioService.inviteNewVentures(request, portfolio);
  }
}
