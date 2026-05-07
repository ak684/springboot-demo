package io.ventureplatform.service;

import io.ventureplatform.dto.request.InviteVentureRequest;
import io.ventureplatform.dto.request.PortfolioRequest;
import io.ventureplatform.dto.response.PortfolioResponse;
import io.ventureplatform.entity.Organization;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioEmployeesRecord;
import io.ventureplatform.entity.PortfolioMemberAccess;
import io.ventureplatform.entity.PortfolioVentureAccess;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.InvitationStatus;
import io.ventureplatform.repository.OrganizationRepository;
import io.ventureplatform.repository.PortfolioMemberAccessRepository;
import io.ventureplatform.repository.PortfolioRepository;
import io.ventureplatform.repository.PortfolioVentureAccessRepository;
import io.ventureplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService extends AbstractBaseEntityService<Portfolio> {
  private final PortfolioRepository portfolioRepository;
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final PortfolioVentureAccessRepository portfolioVentureAccessRepository;
  private final PortfolioMemberAccessRepository portfolioMemberAccessRepository;
  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final SecurityService securityService;

  public List<Portfolio> findMyPortfolios(User user) {
    return securityService.findMyPortfolios(user);
  }

  @Transactional
  public Portfolio createPortfolio(User user, Portfolio portfolio) {
    Organization organization = user.getOrganization();
    if (organization == null) {
      organization = organizationRepository.save(new Organization());
      user.setOrganization(organization);
      userRepository.save(user);
    }

    portfolio.setOrganization(organization);
    portfolio.setInvitationCode(UUID.randomUUID().toString());
    portfolio.setBrandKey(brandResolver.getKeyForCurrentRequest());
    portfolio.getPublicSettings().setPortfolio(portfolio);
    Portfolio savedPortfolio = super.create(portfolio);

    PortfolioMemberAccess memberAccess = new PortfolioMemberAccess()
      .setPortfolio(savedPortfolio)
      .setMember(user)
      .setAccess(AccessType.EDIT)
      .setStatus(InvitationStatus.ACCEPTED);
    portfolioMemberAccessRepository.save(memberAccess);

    return savedPortfolio;
  }

  public Portfolio editPortfolio(Portfolio portfolio, PortfolioRequest request) {
    portfolio
      .setName(request.getName())
      .setDescription(request.getDescription())
      .setMission(request.getMission())
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
      .setHashtags(request.getHashtags())
      .setLogo(request.getLogo())
      .setStreetImage(request.getStreetImage());

    Integer employeeCount = portfolio.getEmployees().isEmpty()
      ? null
      : portfolio.getEmployees().get(portfolio.getEmployees().size() - 1).getCount();
    if (request.getEmployees() != null && !request.getEmployees().equals(employeeCount)) {
      portfolio.getEmployees().add(new PortfolioEmployeesRecord(portfolio, request.getEmployees()));
    }

    return super.update(portfolio.getId(), portfolio);
  }

  public void acceptInvitation(Portfolio portfolio, User invited) {
    portfolio.getMembers().stream()
      .filter(a -> invited.equals(a.getMember()))
      .findFirst()
      .ifPresent(a -> {
        a.setStatus(InvitationStatus.ACCEPTED);
        portfolioMemberAccessRepository.save(a);
      });
  }

  public void declineInvitation(Portfolio portfolio, User invited) {
    portfolio.getMembers().stream()
      .filter(a -> invited.equals(a.getMember()))
      .findFirst()
      .ifPresent(portfolioMemberAccessRepository::delete);
  }

  public PortfolioResponse findByInvitationCode(String code) {
    Portfolio portfolio = portfolioRepository.findByInvitationCode(code);

    if (portfolio != null) {
      return new PortfolioResponse()
        .setName(portfolio.getName())
        .setLogo(portfolio.getLogo());
    } else {
      return null;
    }
  }

  @Transactional
  public void unlinkVenture(Portfolio portfolio, Venture venture) {
    portfolio.getVentures().stream()
      .filter(v -> v.getVenture().getId().equals(venture.getId()))
      .findFirst()
      .ifPresent(v -> {
        portfolio.getVentures().remove(v);
        portfolioVentureAccessRepository.delete(v);
      });
  }

  public void toggleHideVenture(Portfolio portfolio, Venture venture) {
    portfolio.getVentures().stream()
      .filter(v -> v.getVenture().getId().equals(venture.getId()))
      .findFirst()
      .ifPresent(link -> {
        link.setHidden(link.getHidden() == null || !link.getHidden());
        portfolioVentureAccessRepository.save(link);
      });
  }

  public void toggleHidePublicVenture(Portfolio portfolio, Venture venture) {
    portfolio.getVentures().stream()
      .filter(v -> v.getVenture().getId().equals(venture.getId()))
      .findFirst()
      .ifPresent(link -> {
        link.setPublicHidden(link.getPublicHidden() == null || !link.getPublicHidden());
        portfolioVentureAccessRepository.save(link);
      });
  }

  public void inviteNewVentures(InviteVentureRequest request, Portfolio portfolio) {
    request.getEmails().forEach(email -> {
      emailService.sendInviteFromPortfolioEmail(email, request, portfolio, brandResolver.forPortfolio(portfolio));
    });
  }

  public List<PortfolioResponse> getPortfoliosByVenture(Venture venture) {
    List<PortfolioVentureAccess> access = portfolioVentureAccessRepository.findAllByVenture(venture);
    return access.stream()
      .map(a -> {
        Portfolio p = a.getPortfolio();
        PortfolioResponse response = new PortfolioResponse()
          .setName(p.getName())
          .setLogo(p.getLogo());
        response.setId(p.getId());
        response.getAux().put("access", a.getAccess());
        return response;
      })
      .toList();
  }

  public Portfolio getPublicPortfolio(Portfolio portfolio) {
    boolean hasAccess = securityService.isPortfolioMember(portfolio.getOrganization().getId(), portfolio.getId());

    if (!hasAccess && !Boolean.TRUE.equals(portfolio.getPublicSettings().getShared())) {
      return null;
    }

    return portfolio;
  }

  public void updatePublicProfileSettings(Portfolio portfolio, Portfolio request) {
    portfolio.getPublicSettings().setMissionImage(request.getPublicSettings().getMissionImage());
    portfolio.setDescription(request.getDescription());

    portfolioRepository.save(portfolio);
  }

  public void updatePublicVisibility(Portfolio portfolio, HashMap<String, Boolean> body) {
    portfolio.getPublicSettings().setShared(body.get("share"));
    portfolioRepository.save(portfolio);
  }
}
