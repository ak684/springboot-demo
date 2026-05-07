package io.ventureplatform.service;

import io.ventureplatform.dto.request.CompanyMemberAccessRequest;
import io.ventureplatform.dto.request.InviteUserRequest;
import io.ventureplatform.dto.request.PortfolioMemberAccessRequest;
import io.ventureplatform.dto.request.UpdateAccessRequest;
import io.ventureplatform.dto.request.UpdateOrderRequest;
import io.ventureplatform.dto.request.VentureMemberAccessRequest;
import io.ventureplatform.dto.request.VentureRequest;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.entity.CompanyMemberAccess;
import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Organization;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioMemberAccess;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.VentureEmployeesRecord;
import io.ventureplatform.entity.VentureMemberAccess;
import io.ventureplatform.entity.VenturePitchSettings;
import io.ventureplatform.entity.VenturePublicSettings;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.InvitationStatus;
import io.ventureplatform.facade.PortfolioMemberAccessFacade;
import io.ventureplatform.facade.VentureMemberAccessFacade;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyMemberAccessRepository;
import io.ventureplatform.repository.FollowersRepository;
import io.ventureplatform.repository.OrganizationRepository;
import io.ventureplatform.repository.PortfolioCompanyExtractionAccessRepository;
import io.ventureplatform.repository.PortfolioMemberAccessRepository;
import io.ventureplatform.repository.PortfolioRepository;
import io.ventureplatform.repository.PortfolioVentureAccessRepository;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureMemberAccessRepository;
import io.ventureplatform.repository.VentureRepository;
import io.ventureplatform.service.external.ImpactAiService;
import io.ventureplatform.service.external.StripeService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.validation.Valid;
import javax.validation.ValidationException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentureService extends AbstractBaseEntityService<Venture> {
  private final VentureRepository ventureRepository;
  private final UserService userService;
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final ImpactAiService impactAiService;
  private final ImpactService impactService;
  private final FollowersService followersService;
  private final FollowersRepository followersRepository;
  private final PortfolioVentureAccessRepository portfolioVentureAccessRepository;
  private final PortfolioRepository portfolioRepository;
  private final VentureMemberAccessFacade ventureMemberAccessFacade;
  private final PortfolioMemberAccessFacade portfolioMemberAccessFacade;
  private final VentureMemberAccessRepository ventureMemberAccessRepository;
  private final PortfolioMemberAccessRepository portfolioMemberAccessRepository;
  private final CompanyMemberAccessRepository companyMemberAccessRepository;
  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  private final PortfolioCompanyExtractionAccessRepository portfolioCompanyAccessRepository;
  private final StripeService stripeService;
  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final SecurityService securityService;

  public Set<Venture> findMyVentures(User user) {
    Set<Venture> ventures = new HashSet<>();
    if (user.getOrganization() != null) {
      ventures.addAll(user.getOrganization().getVentures());
    }
    ventures.addAll(user.getVentures().stream().map(VentureMemberAccess::getVenture).collect(Collectors.toSet()));
    ventures.addAll(user.getPortfolios().stream()
      .map(PortfolioMemberAccess::getPortfolio)
      .map(Portfolio::getVentures)
      .flatMap(Set::stream)
      .filter(access -> access.getAccess() != AccessType.KEY_DATA)
      .map(PortfolioVentureAccess::getVenture)
      .collect(Collectors.toSet()));
    return ventures;
  }

  public Venture updateImpactOrder(Venture venture, UpdateOrderRequest request) {
    List<Impact> impacts = venture.getImpacts();
    impacts.sort(Comparator.comparing(Impact::getSortOrder));
    Impact toMove = impacts.remove(request.getFrom().intValue());
    int newIndex = request.getFrom() < request.getTo() ? request.getTo() : request.getTo() + 1;
    impacts.add(newIndex, toMove);

    for (int i = 0; i < impacts.size(); i++) {
      impacts.get(i).setSortOrder(i);
    }

    return ventureRepository.save(venture);
  }

  public Venture editVenture(Venture venture, VentureRequest request) {
    venture
      .setName(request.getName())
      .setDescription(request.getDescription())
      .setLegalEntityFormed(request.getLegalEntityFormed())
      .setCountry(request.getCountry())
      .setFormationDate(request.getFormationDate())
      .setProfitOrientation(request.getProfitOrientation())
      .setLegalForm(request.getLegalForm())
      .setAddress(request.getAddress())
      .setCity(request.getCity())
      .setRegion(request.getRegion())
      .setZipCode(request.getZipCode())
      .setLat(request.getLat())
      .setLng(request.getLng())
      .setPhone(request.getPhone())
      .setVolunteers(request.getVolunteers())
      .setWebsite(request.getWebsite())
      .setInstagram(request.getInstagram())
      .setTwitter(request.getTwitter())
      .setLinkedin(request.getLinkedin())
      .setYoutube(request.getYoutube())
      .setFacebook(request.getFacebook())
      .setReportingPeriod(request.getReportingPeriod())
      .setCurrency(request.getCurrency())
      .setIndustries(request.getIndustries())
      .setHashtags(request.getHashtags())
      .setLogo(request.getLogo())
      .setStreetImage(request.getStreetImage());

    Integer employeeCount = venture.getEmployees().isEmpty()
      ? null
      : venture.getEmployees().get(venture.getEmployees().size() - 1).getCount();
    if (request.getEmployees() != null && !request.getEmployees().equals(employeeCount)) {
      venture.getEmployees().add(new VentureEmployeesRecord(venture, request.getEmployees()));
    }

    return super.update(venture.getId(), venture);
  }

  public void updateUserAccess(UpdateAccessRequest request, User user) {
    inviteMember(
      new InviteUserRequest()
        .setEmail(request.getEmail())
        .setVentures(request.getAddedVentures())
        .setPortfolios(request.getAddedPortfolios()),
      user
    );
    revokeAccess(request.getEmail(), request.getRemovedVentures(), request.getRemovedPortfolios(), user);
  }

  public void inviteMember(@Valid InviteUserRequest request, User current) {
    List<VentureMemberAccess> ventureAccess = ventureMemberAccessFacade.dtosToEntityList(request.getVentures());
    List<PortfolioMemberAccess> portfolioAccess = portfolioMemberAccessFacade.dtosToEntityList(request.getPortfolios());
    validateVentureEditRights(current, ventureAccess);
    validatePortfolioEditRights(current, portfolioAccess);
    User invited = userService.findByEmail(request.getEmail());
    boolean newAccount = false;
    List<Venture> accessedVentures = new ArrayList<>();
    List<Portfolio> accessedPortfolios = new ArrayList<>();

    if (invited == null) {
      invited = userService.createInvitedAccount(request.getEmail(), request.getName(), request.getLastName());
      newAccount = true;
    }

    for (int i = 0; i < ventureAccess.size(); i++) {
      Venture venture = ventureRepository.getReferenceById(ventureAccess.get(i).getVenture().getId());
      User finalInvited = invited;
      if (venture.getMembers().stream().noneMatch(a -> a.getMember().equals(finalInvited))
        && (
        invited.getOrganization() == null
          || !venture.getOrganization().getId().equals(invited.getOrganization().getId()))
      ) {
        if (venture.getMembers().size() >= 20) {
          throw new ValidationException("You cannot invite more than 20 members to " + venture.getName());
        }

        ventureMemberAccessRepository.save(
          new VentureMemberAccess(venture, invited, ventureAccess.get(i).getAccess(), InvitationStatus.INVITED)
        );
        accessedVentures.add(venture);
      }
    }

    for (int i = 0; i < portfolioAccess.size(); i++) {
      Portfolio portfolio = portfolioRepository.getReferenceById(portfolioAccess.get(i).getPortfolio().getId());
      User finalInvited = invited;
      if (portfolio.getMembers().stream().noneMatch(a -> a.getMember().equals(finalInvited))
        && (
        invited.getOrganization() == null
          || !portfolio.getOrganization().getId().equals(invited.getOrganization().getId()))
      ) {
        portfolioMemberAccessRepository.save(
          new PortfolioMemberAccess(portfolio, invited, portfolioAccess.get(i).getAccess(), InvitationStatus.INVITED)
        );
        accessedPortfolios.add(portfolio);
      }
    }

    List<CompanyExtractionData> accessedCompanies = new ArrayList<>();
    if (request.getCompanies() != null) {
      for (CompanyMemberAccessRequest companyRequest : request.getCompanies()) {
        validateCompanyPublicProfileGrantRights(current, companyRequest.getCompanyId());
        CompanyExtractionData company =
          companyExtractionDataRepository.getReferenceById(companyRequest.getCompanyId());
        if (companyMemberAccessRepository
            .existsByMemberIdAndCompanyId(invited.getId(), company.getId())) {
          continue;
        }
        companyMemberAccessRepository.save(
          new CompanyMemberAccess(company, invited, companyRequest.getAccess(), InvitationStatus.INVITED)
        );
        accessedCompanies.add(company);
      }
    }

    if (!accessedVentures.isEmpty() || !accessedPortfolios.isEmpty() || !accessedCompanies.isEmpty()) {
      emailService.sendInvitedVentureOrPortfolioEmail(
        current,
        invited,
        request.getMessage(),
        accessedVentures,
        accessedPortfolios,
        newAccount,
        brandResolver.forCurrentRequest()
      );
      notifyOwnerAboutInvitation(current, invited, accessedVentures, accessedPortfolios, true);
    }
  }

  private void validateCompanyPublicProfileGrantRights(User user, Long companyId) {
    List<Portfolio> userPortfolios = securityService.findMyPortfolios(user);
    for (Portfolio portfolio : userPortfolios) {
      boolean hasEdit = portfolio.getMembers().stream()
        .anyMatch(m -> m.getMember().equals(user) && AccessType.EDIT.equals(m.getAccess()));
      boolean orgOwnsPortfolio = user.getOrganization() != null
        && portfolio.getOrganization() != null
        && user.getOrganization().getId().equals(portfolio.getOrganization().getId());
      if (!hasEdit && !orgOwnsPortfolio) {
        continue;
      }
      if (portfolioCompanyAccessRepository
          .existsByCompanyExtractionDataIdAndPortfolioId(companyId, portfolio.getId())) {
        return;
      }
    }

    throw new ValidationException(
      "You don't have edit rights to grant public profile access for this company");
  }

  private void revokeAccess(
    String email, List<VentureMemberAccessRequest> ventures, List<PortfolioMemberAccessRequest> portfolios, User current
  ) {
    List<VentureMemberAccess> ventureAccess = ventureMemberAccessFacade.dtosToEntityList(ventures);
    List<PortfolioMemberAccess> portfolioAccess = portfolioMemberAccessFacade.dtosToEntityList(portfolios);
    validateVentureEditRights(current, ventureAccess);
    validatePortfolioEditRights(current, portfolioAccess);
    User revoked = userService.findByEmail(email);
    List<Venture> revokedVentures = new ArrayList<>();
    List<Portfolio> revokedPortfolios = new ArrayList<>();

    if (revoked != null) {
      for (VentureMemberAccess request : ventureAccess) {
        Venture venture = ventureRepository.getReferenceById(request.getVenture().getId());
        venture.getMembers().stream()
          .filter(a -> a.getId().equals(request.getId()))
          .findFirst()
          .ifPresent(a -> {
            ventureMemberAccessRepository.deleteById(request.getId());
            revokedVentures.add(venture);
          });
      }

      for (PortfolioMemberAccess request : portfolioAccess) {
        Portfolio portfolio = portfolioRepository.getReferenceById(request.getPortfolio().getId());
        portfolio.getMembers().stream()
          .filter(a -> a.getId().equals(request.getId()))
          .findFirst()
          .ifPresent(a -> {
            portfolioMemberAccessRepository.deleteById(request.getId());
            revokedPortfolios.add(portfolio);
          });
      }
    }

    if (!revokedVentures.isEmpty() || !revokedPortfolios.isEmpty()) {
      emailService.sendRevokeAccessEmail(revokedVentures, revokedPortfolios, revoked, brandResolver.forUser(revoked));
      notifyOwnerAboutInvitation(current, revoked, revokedVentures, revokedPortfolios, false);
    }
  }

  private void notifyOwnerAboutInvitation(
    User current, User updated, List<Venture> ventures, List<Portfolio> portfolios, boolean added
  ) {
    Map<Organization, List<Venture>> map = ventures.stream().collect(Collectors.groupingBy(Venture::getOrganization));
    map.keySet().forEach(organization -> {
      if (current.getOrganization() == null || !organization.getId().equals(current.getOrganization().getId())) {
        User owner = organization.getUsers().get(0);
        emailService.sendOwnerNotificationTeamMembers(
          current,
          owner,
          updated,
          map.get(organization),
          added,
          brandResolver.forUser(owner)
        );
      }
    });
    Map<Organization, List<Portfolio>> portfolioMap =
      portfolios.stream().collect(Collectors.groupingBy(Portfolio::getOrganization));
    portfolioMap.keySet().forEach(organization -> {
      if (current.getOrganization() == null || !organization.getId().equals(current.getOrganization().getId())) {
        User owner = organization.getUsers().get(0);
        Portfolio firstPortfolio = portfolioMap.get(organization).get(0);
        emailService.sendOwnerNotificationTeamMembersPortfolio(
          current,
          owner,
          updated,
          portfolioMap.get(organization),
          added,
          brandResolver.forPortfolio(firstPortfolio)
        );
      }
    });
  }

  private void validateVentureEditRights(User user, List<VentureMemberAccess> ventures) {
    ventures.forEach(accessRequest -> {
      Venture venture = ventureRepository.getReferenceById(accessRequest.getVenture().getId());
      if (
        venture.getMembers().stream().noneMatch(m -> m.getMember().equals(user) && m.getAccess().equals(AccessType.EDIT))
          && (user.getOrganization() == null
          || !venture.getOrganization().getId().equals(user.getOrganization().getId()))
      ) {
        throw new ValidationException("You don't have edit rights for " + venture.getName());
      }
    });
  }

  private void validatePortfolioEditRights(User user, List<PortfolioMemberAccess> portfolios) {
    portfolios.forEach(portfolioAccess -> {
      Portfolio portfolio = portfolioRepository.getReferenceById(portfolioAccess.getPortfolio().getId());
      if (
        portfolio.getMembers().stream().noneMatch(m -> m.getMember().equals(user) && m.getAccess().equals(AccessType.EDIT))
          && (user.getOrganization() == null
          || !portfolio.getOrganization().getId().equals(user.getOrganization().getId()))
      ) {
        throw new ValidationException("You don't have edit rights for " + portfolio.getName());
      }
    });
  }

  public void acceptInvitation(Venture venture, User invited) {
    venture.getMembers().stream()
      .filter(a -> invited.equals(a.getMember()))
      .findFirst()
      .ifPresent(a -> {
        a.setStatus(InvitationStatus.ACCEPTED);
        ventureMemberAccessRepository.save(a);
      });
  }

  public void declineInvitation(Venture venture, User invited) {
    venture.getMembers().stream()
      .filter(a -> invited.equals(a.getMember()))
      .findFirst()
      .ifPresent(ventureMemberAccessRepository::delete);
  }

  @Transactional
  public void generatePitchDeck(Venture venture) {
    VenturePitchSettings pitchSettings = venture.getPitchSettings();

    if (StringUtils.isEmpty(pitchSettings.getDescription())) {
      pitchSettings.setDescription(impactAiService.generateVentureDescription(venture));
    }

    for (int i = 0; i < venture.getImpacts().size(); i++) {
      Impact impact = venture.getImpacts().get(i);

      if (StringUtils.isEmpty(impact.getPitchDescription())) {
        impact.setPitchDescription(impactAiService.generateImpactDescription(impact));
      }

      if (StringUtils.isEmpty(impact.getPitchInspiration())) {
        impact.setPitchInspiration(impactAiService.generateImpactInspiration(impact));
      }
    }

    if (pitchSettings.getPitchId() == null) {
      pitchSettings.setPitchId(UUID.randomUUID().toString());
    }

    ventureRepository.save(venture);
  }

  public void updatePitchSettings(Venture venture, Venture update, String slide, Long impactId) {
    venture.getImpacts().forEach(impact -> {
      update.getImpacts().stream()
        .filter(i -> i.getId().equals(impact.getId()))
        .findFirst().ifPresent(requestImpact -> {
          impact.setPitchOrder(requestImpact.getPitchOrder());
          impact.setPitchEnabled(requestImpact.getPitchEnabled());

          impact.getIndicators().forEach(indicator -> {
            requestImpact.getIndicators().stream()
              .filter(i -> i.getId().equals(indicator.getId()))
              .findFirst().ifPresent(requestIndicator -> {
                indicator.setPitchOrder(requestIndicator.getPitchOrder());
                indicator.setPitchEnabled(requestIndicator.getPitchEnabled());
              });
          });
        });
    });

    venture.getPitchSettings().setColor(update.getPitchSettings().getColor());
    venture.getPitchSettings().setTheme(update.getPitchSettings().getTheme());

    if ("intro".equals(slide)) {
      venture.setName(update.getName());
      venture.getPitchSettings().setIntroSubtitle(update.getPitchSettings().getIntroSubtitle());
      venture.getPitchSettings().setShowWebsite(update.getPitchSettings().getShowWebsite());
      venture.getPitchSettings().setShowInstagram(update.getPitchSettings().getShowInstagram());
      venture.getPitchSettings().setShowFacebook(update.getPitchSettings().getShowFacebook());
      venture.getPitchSettings().setShowTwitter(update.getPitchSettings().getShowTwitter());
      venture.getPitchSettings().setShowLinkedin(update.getPitchSettings().getShowLinkedin());
      venture.getPitchSettings().setShowYoutube(update.getPitchSettings().getShowYoutube());
      venture.getPitchSettings().setShowCertification(update.getPitchSettings().getShowCertification());
      venture.getPitchSettings().setIntroImage(update.getPitchSettings().getIntroImage());
    } else if ("mission".equals(slide)) {
      venture.setDescription(update.getDescription());
      venture.setEmployees(update.getEmployees());
      venture.getPitchSettings().setShowWebsite(update.getPitchSettings().getShowWebsite());
      venture.getPitchSettings().setShowInstagram(update.getPitchSettings().getShowInstagram());
      venture.getPitchSettings().setShowFacebook(update.getPitchSettings().getShowFacebook());
      venture.getPitchSettings().setShowTwitter(update.getPitchSettings().getShowTwitter());
      venture.getPitchSettings().setShowLinkedin(update.getPitchSettings().getShowLinkedin());
      venture.getPitchSettings().setShowYoutube(update.getPitchSettings().getShowYoutube());
      venture.getPitchSettings().setShowCertification(update.getPitchSettings().getShowCertification());
      venture.getPitchSettings().setMissionImage(update.getPitchSettings().getMissionImage());
    } else if ("description".equals(slide)) {
      venture.setDescription(update.getDescription());
      venture.getPitchSettings().setDescription(update.getPitchSettings().getDescription());
      venture.getPitchSettings().setFounder(update.getPitchSettings().getFounder());
      venture.getPitchSettings().setDescriptionImage(update.getPitchSettings().getDescriptionImage());
    } else if ("impacts".equals(slide)) {
      update.getImpacts().stream().filter(i -> i.getId().equals(impactId)).findFirst().ifPresent(ri -> {
        venture.getImpacts().stream().filter(i -> i.getId().equals(impactId)).findFirst().ifPresent(impact -> {
          impact.setName(ri.getName());
          impact.setImage(ri.getImage());
          impact.setPitchDescription(ri.getPitchDescription());
          impact.setPitchInspiration(ri.getPitchInspiration());
          impact.getIndicators().forEach(indicator -> {
            ri.getIndicators().stream().filter(i -> i.getId().equals(indicator.getId())).findFirst().ifPresent(i -> {
              indicator.setPitchView(i.getPitchView());
            });
          });
        });
      });
    }

    ventureRepository.save(venture);
  }

  public void updatePublicProfileSettings(Venture venture, Venture update) {
    venture.getPitchSettings().setDescription(update.getPitchSettings().getDescription());
    venture.getPitchSettings().setDescriptionImage(update.getPitchSettings().getDescriptionImage());
    venture.setDescription(update.getDescription());

    venture.getImpacts().forEach(impact -> {
      update.getImpacts().stream()
        .filter(i -> i.getId().equals(impact.getId()))
        .findFirst().ifPresent(requestImpact -> {
          impact.setPublicOrder(requestImpact.getPublicOrder());
          impact.setPublicEnabled(requestImpact.getPublicEnabled());

          impact.getIndicators().forEach(indicator -> {
            requestImpact.getIndicators().stream()
              .filter(i -> i.getId().equals(indicator.getId()))
              .findFirst().ifPresent(requestIndicator -> {
                indicator.setPublicOrder(requestIndicator.getPublicOrder());
                indicator.setPublicEnabled(requestIndicator.getPublicEnabled());
                indicator.setPublicView(requestIndicator.getPublicView());
              });
          });
        });
    });

    ventureRepository.save(venture);
  }

  public Venture getPitchVenture(String uuid, boolean userAuthenticated) {
    Venture venture = ventureRepository.findByPitchSettingsPitchId(uuid);

    if (!Boolean.TRUE.equals(venture.getPitchSettings().getShared()) && !userAuthenticated) {
      return null;
    }

    venture.setImpacts(venture.getImpacts().stream()
      .filter(i -> Boolean.TRUE.equals(i.getPitchEnabled()))
      .filter(i -> !i.getDraft())
      .sorted(Comparator.comparing(
        Impact::getPitchOrder,
        Comparator.nullsLast(Comparator.naturalOrder())
      ))
      .toList());
    venture.getImpacts().forEach(impact ->
      impact.setIndicators(impact.getIndicators().stream()
        .filter(i -> Boolean.TRUE.equals(i.getPitchEnabled()))
        .sorted(Comparator.comparing(
          ImpactIndicator::getPitchOrder,
          Comparator.nullsLast(Comparator.naturalOrder())
        ))
        .toList())
    );

    return venture;
  }

  // If some data needs to be hidden or removed before sending to public domain, we can do it in this method
  public Venture getPublicVenture(Venture venture, Integer days) {
    boolean hasAccess = securityService.isMember(venture.getOrganization().getId(), venture.getId())
      && securityService.editAllowed(venture.getId());

    VenturePublicSettings publicSettings = venture.getPublicSettings();
    if (!hasAccess
        && (publicSettings == null || !Boolean.TRUE.equals(publicSettings.getShared()))) {
      return null;
    }

    Venture response = new Venture()
      .setName(venture.getName())
      .setDescription(venture.getDescription())
      .setSortImpactsBy(venture.getSortImpactsBy())
      .setLegalEntityFormed(venture.getLegalEntityFormed())
      .setCountry(venture.getCountry())
      .setProfitOrientation(venture.getProfitOrientation())
      .setLegalForm(venture.getLegalForm())
      .setAddress(venture.getAddress())
      .setCity(venture.getCity())
      .setRegion(venture.getRegion())
      .setZipCode(venture.getZipCode())
      .setLat(venture.getLat())
      .setLng(venture.getLng())
      .setPhone(venture.getPhone())
      .setEmployees(venture.getEmployees())
      .setVolunteers(venture.getVolunteers())
      .setWebsite(venture.getWebsite())
      .setInstagram(venture.getInstagram())
      .setTwitter(venture.getTwitter())
      .setLinkedin(venture.getLinkedin())
      .setYoutube(venture.getYoutube())
      .setFacebook(venture.getFacebook())
      .setReportingPeriod(venture.getReportingPeriod())
      .setLogo(venture.getLogo())
      .setStreetImage(venture.getStreetImage())
      .setCertification(venture.getCertification())
      .setTeam(venture.getTeam())
      .setAcceleration(venture.getAcceleration())
      .setFunding(venture.getFunding())
      .setAwards(venture.getAwards())
      .setCurrency(venture.getCurrency());

    response.setImpacts(venture.getImpacts().stream()
      .filter(i -> Boolean.TRUE.equals(i.getPublicEnabled()))
      .filter(i -> !i.getDraft())
      .sorted(Comparator.comparing(
        Impact::getPitchOrder,
        Comparator.nullsLast(Comparator.naturalOrder())
      ))
      .toList());
    response.getImpacts().forEach(impact ->
      impact.setIndicators(impact.getIndicators().stream()
        .filter(i -> Boolean.TRUE.equals(i.getPublicEnabled()))
        .sorted(Comparator.comparing(
          ImpactIndicator::getPublicOrder,
          Comparator.nullsLast(Comparator.naturalOrder())
        ))
        .toList())
    );

    if (venture.getPitchSettings() != null) {
      response.getPitchSettings()
        .setDescription(venture.getPitchSettings().getDescription());
      response.getPitchSettings()
        .setDescriptionImage(venture.getPitchSettings().getDescriptionImage());
      response.getPitchSettings().setColor(venture.getPitchSettings().getColor());
    }

    response.setId(venture.getId());
    response.setCreatedAt(venture.getCreatedAt());
    addVentureTraction(response, days);

    return response;
  }

  public void addVentureTraction(Venture venture, Integer days) {
    List<Followers> followers = followersService.getTotalFollowers(venture, days);
    long totalFollowers = followers.stream().map(Followers::getValue).mapToLong(Long::longValue).sum();
    long totalChange = followers.stream().map(Followers::getChange).mapToLong(Long::longValue).sum();
    venture.getAux().put("followers", totalFollowers);
    venture.getAux().put("followerChange", totalChange);

    if (followers.isEmpty() || totalFollowers == 0) {
      venture.getAux().put("traction", 0d);
    } else {
      venture.getAux().put("traction", (totalChange * 1.0d / totalFollowers) * 100);
    }
  }

  public void updatePitchVisibility(Venture venture, HashMap<String, Boolean> body) {
    venture.getPitchSettings().setShared(body.get("share"));
    venture.getPitchSettings().setAllowDownloadFiles(body.get("allowDownloadFiles"));
    ventureRepository.save(venture);
  }

  public void updatePublicVisibility(Venture venture, HashMap<String, Boolean> body) {
    Boolean share = body.get("share");
    if (share && (venture.getCertification() == null || venture.getCertification() == 0)) {
      throw new RuntimeException("Only certified ventures can share their profile");
    }
    venture.getPublicSettings().setShared(body.get("share"));
    ventureRepository.save(venture);
  }

  @Transactional
  public void deleteVenture(Venture venture) {
    venture.getImpacts().forEach(impactService::deleteImpact);
    followersRepository.deleteAllByVenture(venture);
    ventureRepository.deleteById(venture.getId());
  }

  public void linkVentureToPortfolio(Venture venture, String code, AccessType access) {
    Portfolio portfolio = portfolioRepository.findByInvitationCode(code);

    if (portfolio != null) {
      PortfolioVentureAccess link = portfolioVentureAccessRepository.findByVentureAndPortfolio(venture, portfolio);

      if (link == null) {
        // toDO: Add notification email
        PortfolioVentureAccess newLink = new PortfolioVentureAccess()
          .setPortfolio(portfolio)
          .setVenture(venture)
          .setAccess(access);
        portfolioVentureAccessRepository.save(newLink);
      } else {
        link.setAccess(access);
        portfolioVentureAccessRepository.save(link);
      }
    }
  }

  public Map<Long, AccessType> getVenturesAccessRights(User user) {
    Map<Long, AccessType> result = new HashMap<>();

    if (user.getOrganization() != null) {
      user.getOrganization().getVentures().forEach(venture -> result.put(venture.getId(), AccessType.EDIT));
    }

    user.getVentures().forEach(access -> result.put(access.getVenture().getId(), access.getAccess()));

    securityService.findMyPortfolios(user).stream()
      .map(Portfolio::getVentures)
      .flatMap(Set::stream)
      .forEach(access -> result.put(access.getVenture().getId(), access.getAccess()));

    return result;
  }

  @Transactional
  public Venture createVenture(User user, Venture venture) {
    List<String> subscriptionSlots = stripeService.getFreeSubscriptionSlots(user);

    if (subscriptionSlots.isEmpty()) {
      throw new ValidationException(
        "Cannot create venture. There are no free active subscriptions left on your account"
      );
    }

    Organization organization = user.getOrganization();
    if (organization == null) {
      organization = organizationRepository.save(new Organization());
      user.setOrganization(organization);
      userRepository.save(user);
    }

    venture.setOrganization(organization);
    venture.getPitchSettings().setVenture(venture);
    venture.getPublicSettings().setVenture(venture);
    venture.getPitchSettings().setIntroImage("/images/pitch/background/background3.jpeg");
    venture.getPitchSettings().setMissionImage("/images/pitch/background/background1.jpeg");
    venture.setActive(true);
    venture.setSubscriptionId(subscriptionSlots.get(0));
    venture.setSubscriptionType(stripeService.getSubscriptionType(subscriptionSlots.get(0)));

    return ventureRepository.save(venture);
  }

  public Boolean hasFreeSubscriptionSlots(User user) {
    return stripeService.getFreeSubscriptionSlots(user).size() > 0;
  }

  public Venture activateVenture(User user, Venture venture) {
    List<String> slots = stripeService.getFreeSubscriptionSlots(user);
    if (slots.isEmpty()) {
      throw new ValidationException(
        "Cannot activate venture. There are no free active subscriptions left on your account"
      );
    } else {
      if (!Objects.equals(venture.getOrganization(), user.getOrganization())) {
        if (user.getOrganization() == null) {
          Organization organization = new Organization();
          organization = organizationRepository.save(organization);
          user.setOrganization(organization);
          userRepository.save(user);
        }
      }

      venture.setOrganization(user.getOrganization());
      venture.setSubscriptionId(slots.get(0));
      venture.setSubscriptionType(stripeService.getSubscriptionType(slots.get(0)));
      venture.setActive(true);
    }
    return ventureRepository.save(venture);
  }

  public List<Venture> getPublicVentures(Integer days) {
    return ventureRepository.findPublicVentures()
      .stream()
      .map((venture) -> this.getPublicVenture(venture, days))
      .toList();
  }

  @Transactional
  public void updateVentureGeography(Venture venture, String geography) {
    venture.setGeography(geography);
    ventureRepository.save(venture);
  }
}
