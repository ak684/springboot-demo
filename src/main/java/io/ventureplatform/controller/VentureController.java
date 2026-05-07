package io.ventureplatform.controller;

import com.fasterxml.jackson.annotation.JsonView;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.AccelerationRecordRequest;
import io.ventureplatform.dto.request.AwardRequest;
import io.ventureplatform.dto.request.FundingRoundRequest;
import io.ventureplatform.dto.request.ImpactIndicatorRequest;
import io.ventureplatform.dto.request.ImpactRequest;
import io.ventureplatform.dto.request.ImpactScoreRequest;
import io.ventureplatform.dto.request.InviteUserRequest;
import io.ventureplatform.dto.request.TeamMemberRequest;
import io.ventureplatform.dto.request.UpdateAccessRequest;
import io.ventureplatform.dto.request.UpdateImpactFieldRequest;
import io.ventureplatform.dto.request.UpdateOrderRequest;
import io.ventureplatform.dto.request.VentureRequest;
import io.ventureplatform.dto.response.AccelerationRecordResponse;
import io.ventureplatform.dto.response.AwardResponse;
import io.ventureplatform.dto.response.FundingRoundResponse;
import io.ventureplatform.dto.response.ImpactAutofill;
import io.ventureplatform.dto.response.ImpactResponse;
import io.ventureplatform.dto.response.TeamMemberResponse;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.dto.response.Views;
import io.ventureplatform.entity.AccelerationRecord;
import io.ventureplatform.entity.Award;
import io.ventureplatform.entity.FundingRound;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.TeamMember;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.facade.AccelerationRecordFacade;
import io.ventureplatform.facade.AwardFacade;
import io.ventureplatform.facade.FundingRoundFacade;
import io.ventureplatform.facade.ImpactFacade;
import io.ventureplatform.facade.ImpactGoalFacade;
import io.ventureplatform.facade.TeamMemberFacade;
import io.ventureplatform.facade.VentureFacade;
import io.ventureplatform.service.AccelerationRecordService;
import io.ventureplatform.service.AwardService;
import io.ventureplatform.service.FundingRoundService;
import io.ventureplatform.service.ImpactService;
import io.ventureplatform.service.PortfolioService;
import io.ventureplatform.service.PortfolioAggregatedService;
import io.ventureplatform.service.TeamMemberService;
import io.ventureplatform.service.UserVentureDraftService;
import io.ventureplatform.service.VentureService;
import io.ventureplatform.util.CurrentUser;
import io.jsonwebtoken.lang.Collections;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/ventures")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class VentureController {
  private final VentureFacade ventureFacade;
  private final VentureService ventureService;
  private final ImpactFacade impactFacade;
  private final ImpactService impactService;
  private final ImpactGoalFacade impactGoalFacade;
  private final TeamMemberFacade teamMemberFacade;
  private final TeamMemberService teamMemberService;
  private final AccelerationRecordFacade accelerationRecordFacade;
  private final AccelerationRecordService accelerationRecordService;
  private final FundingRoundFacade fundingRoundFacade;
  private final FundingRoundService fundingRoundService;
  private final AwardFacade awardFacade;
  private final AwardService awardService;
  private final PortfolioService portfolioService;
  private final UserVentureDraftService userVentureDraftService;
  private final PortfolioAggregatedService portfolioAggregatedService;

  @GetMapping
  @JsonView(Views.Basic.class)
  public ResponseEntity<List<VentureResponse>> getVentures(@CurrentUser User user) {
    return ResponseEntity.ok(ventureFacade.findMyVentures(user));
  }

  @GetMapping("details")
  public ResponseEntity<List<VentureResponse>> getVenturesWithDetails(@CurrentUser User user) {
    return ResponseEntity.ok(ventureFacade.findMyVentures(user));
  }

  @PutMapping("invitations/{ventureId}/accept")
  public void acceptInvitation(@PathVariable(name = "ventureId") Venture venture, @CurrentUser User user) {
    ventureService.acceptInvitation(venture, user);
  }

  @PutMapping("invitations/{ventureId}/decline")
  public void declineInvitation(@PathVariable(name = "ventureId") Venture venture, @CurrentUser User user) {
    ventureService.declineInvitation(venture, user);
  }

  @PostMapping
  public ResponseEntity<VentureResponse> createVenture(
    @CurrentUser User user,
    @RequestBody @Valid VentureRequest request
  ) {
    return ResponseEntity.ok(ventureFacade.createVenture(user, request));
  }

  @PutMapping("{id}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<VentureResponse> editVenture(
    @PathVariable(name = "id") Venture venture,
    @RequestBody @Valid VentureRequest request
  ) {
    return ResponseEntity.ok(ventureFacade.editVenture(venture, request));
  }

  @DeleteMapping("{id}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteVenture(@PathVariable(name = "id") Venture venture) {
    ventureService.deleteVenture(venture);
  }

  @GetMapping("{ventureId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<VentureResponse> getVenture(@PathVariable(name = "ventureId") Venture venture) {
    return ResponseEntity.ok(ventureFacade.entityToDto(venture));
  }

  @PostMapping("{ventureId}/impacts")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> createImpact(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody @Valid ImpactRequest request
  ) {
    return ResponseEntity.ok(impactFacade.createImpact(venture, request));
  }

  @PostMapping("{ventureId}/impacts/bulk")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void createBulkImpacts(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody @Valid List<Map<String, Object>> request
  ) {
    impactService.createBulkImpacts(venture, request);
  }

  @PutMapping("{ventureId}/impacts/{impactId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> editImpact(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid ImpactRequest request
  ) {
    return ResponseEntity.ok(impactFacade.editImpact(impact, request));
  }

  @PutMapping("{ventureId}/impacts/{impactId}/quantify")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id) "
    + "AND proSubscription(#venture.id)")
  public ResponseEntity<ImpactResponse> quantifyImpact(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid ImpactRequest request
  ) {
    return ResponseEntity.ok(impactFacade.quantifyImpact(impact, request));
  }

  @PutMapping("{ventureId}/impacts/{impactId}/field")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> updateField(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid UpdateImpactFieldRequest request
  ) {
    return ResponseEntity.ok(impactFacade.updateField(impact, request));
  }

  @PutMapping("{ventureId}/impacts/order")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<VentureResponse> updateImpactOrder(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody @Valid UpdateOrderRequest request
  ) {
    return ResponseEntity.ok(ventureFacade.updateImpactOrder(venture, request));
  }

  @PostMapping("{ventureId}/impacts/{impactId}/scoring")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> scoreImpact(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid ImpactScoreRequest request
  ) {
    if (!Collections.isEmpty(request.getGoals())) {
      impactGoalFacade.saveGoals(request.getGoals(), impact);
    }

    return ResponseEntity.ok(impactFacade.scoreImpact(impact, request));
  }

  @DeleteMapping("{ventureId}/impacts/{impactId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteImpact(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact
  ) {
    impactService.deleteImpact(impact);
  }

  @PutMapping("{ventureId}/impacts/{impactId}/draft")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> toggleImpactDraft(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody Boolean draft
  ) {
    return ResponseEntity.ok(impactFacade.toggleImpactDraft(impact, draft));
  }

  @PostMapping("{ventureId}/impacts/{impactId}/indicators")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> addIndicator(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "impactId") Impact impact,
    @RequestBody @Valid ImpactIndicatorRequest request
  ) {
    return ResponseEntity.ok(impactFacade.addIndicator(impact, request));
  }

  @PutMapping("{ventureId}/indicators/{indicatorId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> editIndicator(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "indicatorId") ImpactIndicator indicator,
    @RequestBody @Valid ImpactIndicatorRequest request
  ) {
    return ResponseEntity.ok(impactFacade.editIndicator(indicator, request));
  }

  @DeleteMapping("{ventureId}/indicators/{indicatorId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<ImpactResponse> deleteIndicator(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "indicatorId") ImpactIndicator indicator
  ) {
    return ResponseEntity.ok(impactFacade.deleteIndicator(indicator));
  }

  @GetMapping("{ventureId}/impacts/autofill")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<ImpactAutofill> getImpactAutofillValues(@PathVariable(name = "ventureId") Venture venture) {
    return ResponseEntity.ok(impactService.getImpactAutofillValues(venture));
  }

  @PostMapping("invite")
  public void inviteMember(@RequestBody @Valid InviteUserRequest request, @CurrentUser User user) {
    ventureService.inviteMember(request, user);
  }

  @PutMapping("access")
  public void updateUserAccess(@RequestBody @Valid UpdateAccessRequest request, @CurrentUser User user) {
    ventureService.updateUserAccess(request, user);
  }

  @GetMapping("subscriptionSlots")
  public ResponseEntity<Boolean> hasFreeSubscriptions(@CurrentUser User user) {
    return ResponseEntity.ok(ventureService.hasFreeSubscriptionSlots(user));
  }

  @PutMapping("{ventureId}/activate")
  public ResponseEntity<VentureResponse> activateVenture(
    @PathVariable(name = "ventureId") Venture venture,
    @CurrentUser User user
  ) {
    return ResponseEntity.ok(ventureFacade.activateVenture(user, venture));
  }

  // Managing team members

  @PostMapping("{ventureId}/team")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<TeamMemberResponse> addTeamMember(
    @RequestBody @Valid TeamMemberRequest request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    return ResponseEntity.ok(teamMemberFacade.addTeamMember(request, venture));
  }

  @PutMapping("{ventureId}/team/{memberId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<TeamMemberResponse> editTeamMember(
    @RequestBody @Valid TeamMemberRequest request,
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "memberId") TeamMember existing
  ) {
    return ResponseEntity.ok(teamMemberFacade.editTeamMember(request, existing));
  }

  @PutMapping("{ventureId}/team/order")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void updateTeamMembersOrderAndType(
    @RequestBody @Valid List<TeamMemberRequest> request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    teamMemberService.updateTeamMembersOrderAndType(request);
  }

  @DeleteMapping("{ventureId}/team/{memberId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteTeamMember(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "memberId") TeamMember teamMember
  ) {
    teamMemberService.deleteById(teamMember.getId());
  }

  // Managing acceleration records

  @PostMapping("{ventureId}/acceleration")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<AccelerationRecordResponse> addAcceleration(
    @RequestBody @Valid AccelerationRecordRequest request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    return ResponseEntity.ok(accelerationRecordFacade.addAcceleration(request, venture));
  }

  @PutMapping("{ventureId}/acceleration/{accelerationId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<AccelerationRecordResponse> editAcceleration(
    @RequestBody @Valid AccelerationRecordRequest request,
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "accelerationId") AccelerationRecord existing
  ) {
    return ResponseEntity.ok(accelerationRecordFacade.editAcceleration(request, existing));
  }

  @DeleteMapping("{ventureId}/acceleration/{accelerationId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteAcceleration(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "accelerationId") AccelerationRecord acceleration
  ) {
    accelerationRecordService.deleteById(acceleration.getId());
  }

  @PostMapping("{ventureId}/aggregated/recalculate")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public ResponseEntity<Map<String, Object>> recalculateAggregatedIndicators(
    @PathVariable(name = "ventureId") Venture venture
  ) {
    // Find all portfolios that contain this venture and recalculate their aggregated indicators
    int totalUpdated = portfolioAggregatedService.recalculateIndicatorsForAllPortfoliosContainingVenture(venture.getId());
    
    return ResponseEntity.ok(Map.of(
        "ventureId", venture.getId(),
        "indicatorsUpdated", totalUpdated
    ));
  }

  @GetMapping("acceleration/search")
  public ResponseEntity<List<AccelerationRecordResponse>> searchAccelerations(
    @RequestParam String search,
    @CurrentUser User user
  ) {
    List<VentureResponse> ventures = ventureFacade.findMyVentures(user);
    return ResponseEntity.ok(accelerationRecordFacade.searchAccelerations(ventures, search));
  }

  // Managing funding rounds

  @PostMapping("{ventureId}/funding")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<FundingRoundResponse> addFundingRound(
    @RequestBody @Valid FundingRoundRequest request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    return ResponseEntity.ok(fundingRoundFacade.addFundingRound(request, venture));
  }

  @PutMapping("{ventureId}/funding/{roundId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<FundingRoundResponse> editFundingRound(
    @RequestBody @Valid FundingRoundRequest request,
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "roundId") FundingRound existing
  ) {
    return ResponseEntity.ok(fundingRoundFacade.editFundingRound(request, existing));
  }

  @DeleteMapping("{ventureId}/funding/{roundId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteFundingRound(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "roundId") FundingRound round
  ) {
    fundingRoundService.deleteById(round.getId());
  }

  // Managing awards

  @PostMapping("{ventureId}/awards")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<AwardResponse> addAward(
    @RequestBody @Valid AwardRequest request,
    @PathVariable(name = "ventureId") Venture venture
  ) {
    return ResponseEntity.ok(awardFacade.addAward(request, venture));
  }

  @PutMapping("{ventureId}/awards/{awardId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public ResponseEntity<AwardResponse> editAward(
    @RequestBody @Valid AwardRequest request,
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "awardId") Award existing
  ) {
    return ResponseEntity.ok(awardFacade.editAward(request, existing));
  }

  @DeleteMapping("{ventureId}/awards/{awardId}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void deleteAward(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "awardId") Award award
  ) {
    awardService.deleteById(award.getId());
  }

  @PostMapping("{ventureId}/link/{code}")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND editAllowed(#venture.id)")
  public void linkVentureToPortfolio(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable String code,
    @RequestBody @NotNull AccessType access
  ) {
    ventureService.linkVentureToPortfolio(venture, code, access);
  }

  @GetMapping("access")
  public ResponseEntity<Map<Long, AccessType>> getVenturesAccessRights(@CurrentUser User user) {
    return ResponseEntity.ok(ventureService.getVenturesAccessRights(user));
  }

  // Manage portfolio access
  @PutMapping("{ventureId}/portfolios/{portfolioId}/unlink")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id) AND isPortfolioVenture(#venture.id, #portfolio.id)")
  public void unlinkVentureFromPortfolio(
    @PathVariable(name = "ventureId") Venture venture,
    @PathVariable(name = "portfolioId") Portfolio portfolio
  ) {
    portfolioService.unlinkVenture(portfolio, venture);
  }

  // Mark ventures as draft
  @PutMapping("{ventureId}/draft")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public void toggleMarkVentureAsDraft(
    @PathVariable(name = "ventureId") Venture venture,
    @CurrentUser User user
  ) {
    userVentureDraftService.toggleMarkVentureDraft(user, venture);
  }

  @PutMapping("{ventureId}/geography")
  @PreAuthorize("isMember(#venture.organization.id, #venture.id)")
  public void updateVentureGeography(
    @PathVariable(name = "ventureId") Venture venture,
    @CurrentUser User user,
    @RequestBody String geography
  ) {
    ventureService.updateVentureGeography(venture, geography);
  }
}
