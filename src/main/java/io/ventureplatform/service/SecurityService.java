package io.ventureplatform.service;

import io.ventureplatform.configuration.SuperAdminConfiguration;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.PortfolioMemberAccess;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.VentureMemberAccess;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.SubscriptionType;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.repository.CompanyMemberAccessRepository;
import io.ventureplatform.repository.PortfolioCompanyExtractionAccessRepository;
import io.ventureplatform.repository.PortfolioRepository;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureRepository;
import javax.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecurityService {
  private static final String SYS_ADMIN_KEY_HEADER = "X-Sys-Admin-Key";

  private final UserRepository userRepository;
  private final VentureRepository ventureRepository;
  private final PortfolioRepository portfolioRepository;
  private final CompanyExtractionDataRepository companyExtractionDataRepository;
  private final PortfolioCompanyExtractionAccessRepository portfolioCompanyAccessRepository;
  private final CompanyMemberAccessRepository companyMemberAccessRepository;
  private final SuperAdminConfiguration superAdminConfiguration;

  @Value("${sysadmin.api-key:}")
  private String sysAdminApiKey;

  private User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null) {
      String username = authentication.getName();

      if (StringUtils.hasLength(username)) {
        return userRepository.findByEmail(username).orElse(null);
      }
    }
    return null;
  }

  public boolean userAuthenticated() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null) {
      String username = authentication.getName();

      if (StringUtils.hasLength(username)) {
        return userRepository.existsByEmail(username);
      }
    }

    return false;
  }

  public boolean isMember(Long organizationId, Long ventureId) {
    // Superadmins have access to all ventures
    if (isSuperAdmin()) {
      return true;
    }

    User user = getCurrentUser();
    Venture venture = ventureRepository.getReferenceById(ventureId);
    return user != null
      && ((user.getOrganization() != null && user.getOrganization().getId().equals(organizationId))
      || venture.getMembers().stream().anyMatch(a -> a.getMember().equals(user)));
  }

  public boolean isPortfolioMember(Long organizationId, Long portfolioId) {
    // First check if portfolio exists
    if (portfolioId != null && !portfolioRepository.existsById(portfolioId)) {
      return false;
    }

    // Superadmins have access to all existing portfolios
    if (isSuperAdmin()) {
      return true;
    }

    User user = getCurrentUser();
    Portfolio portfolio = portfolioRepository.getReferenceById(portfolioId);
    return user != null
      && ((user.getOrganization() != null && user.getOrganization().getId().equals(organizationId))
      || portfolio.getMembers().stream().anyMatch(a -> a.getMember().equals(user)));
  }

  public boolean portfolioExists(Long portfolioId) {
    return portfolioId != null && portfolioRepository.existsById(portfolioId);
  }

  public boolean isPortfolioVenture(Long ventureId, Long portfolioId) {
    Portfolio portfolio = portfolioRepository.getReferenceById(portfolioId);

    return portfolio.getVentures().stream()
      .anyMatch(v -> v.getVenture().getId().equals(ventureId));
  }

  public List<Portfolio> findMyPortfolios(User user) {
    // Superadmins can see all portfolios
    if (isSuperAdmin()) {
      return portfolioRepository.findAll();
    }

    Set<Portfolio> portfolios = new HashSet<>();
    if (user.getOrganization() != null) {
      portfolios.addAll(user.getOrganization().getPortfolios());
    }
    portfolios.addAll(user.getPortfolios().stream().map(PortfolioMemberAccess::getPortfolio).collect(Collectors.toSet()));
    return new ArrayList<>(portfolios);
  }

  public boolean editAllowed(Long ventureId) {
    // Superadmins can edit any active venture
    if (isSuperAdmin()) {
      Venture venture = ventureRepository.getReferenceById(ventureId);
      return Boolean.TRUE.equals(venture.getActive());
    }

    User user = getCurrentUser();
    if (user != null) {
      Venture venture = ventureRepository.getReferenceById(ventureId);

      if (!Boolean.TRUE.equals(venture.getActive())) {
        return false;
      }

      if (venture.getOrganization().getUsers().contains(user)) {
        return true;
      }

      Optional<VentureMemberAccess> userAccess = venture.getMembers().stream()
        .filter(access -> access.getMember().equals(user))
        .findFirst();

      return userAccess
        .map(ventureMemberAccess -> ventureMemberAccess.getAccess() == AccessType.EDIT)
        .orElseGet(
          () -> findMyPortfolios(user).stream()
            .map(Portfolio::getVentures)
            .flatMap(Set::stream)
            .filter(access -> access.getVenture().getId().equals(ventureId))
            .findFirst()
            .map(access -> AccessType.EDIT.equals(access.getAccess()))
            .orElse(false)
        );

    }

    return false;
  }

  public boolean proSubscription(Long ventureId) {
    // Superadmins have access to all PRO features
    if (isSuperAdmin()) {
      return true;
    }

    Optional<Venture> venture = ventureRepository.findById(ventureId);
    return venture.map(v -> SubscriptionType.PRO.equals(v.getSubscriptionType())).orElse(false);
  }

  public boolean isSuperAdmin() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null) {
      return false;
    }

    String email = authentication.getName();
    return superAdminConfiguration.isSuperAdmin(email);
  }

  /**
   * Check if request is authorized via sysadmin API key OR superadmin JWT.
   * Use this for endpoints that need to be accessible by both AI agents
   * (via API key) and human superadmins (via JWT authentication).
   */
  public boolean isSysAdminOrSuperAdmin() {
    if (isSuperAdmin()) {
      return true;
    }
    if (!StringUtils.hasLength(sysAdminApiKey)) {
      return false;
    }
    ServletRequestAttributes attrs =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attrs == null) {
      return false;
    }
    HttpServletRequest request = attrs.getRequest();
    String providedKey = request.getHeader(SYS_ADMIN_KEY_HEADER);
    return sysAdminApiKey.equals(providedKey);
  }

  public boolean canAccessCompany(Long companyId) {
    if (isSuperAdmin()) {
      return true;
    }

    User user = getCurrentUser();
    if (user == null) {
      return false;
    }

    List<Portfolio> userPortfolios = findMyPortfolios(user);
    if (userPortfolios.isEmpty()) {
      return false;
    }

    for (Portfolio portfolio : userPortfolios) {
      boolean hasAccess = portfolioCompanyAccessRepository
        .existsByCompanyExtractionDataIdAndPortfolioId(companyId, portfolio.getId());
      if (hasAccess) {
        return true;
      }
    }

    return false;
  }

  public boolean canEditCompanyPublicProfile(Long companyId) {
    if (isSuperAdmin()) {
      return true;
    }

    User user = getCurrentUser();
    if (user == null) {
      return false;
    }

    if (companyMemberAccessRepository.existsByMemberIdAndCompanyId(user.getId(), companyId)) {
      return true;
    }

    return canAccessCompany(companyId);
  }

}
