package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.dto.response.CertificationCriteriaResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.VentureMemberAccess;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.InvitationStatus;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureMemberAccessRepository;
import lombok.RequiredArgsConstructor;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CertificationService {
  private final CalculationService calculationService;
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final UserRepository userRepository;
  private final VentureMemberAccessRepository ventureMemberAccessRepository;
  private final BrandingProperties brandingProperties;

  public CertificationCriteriaResponse getCertificationCriteria(Venture venture) {
    Double score = calculationService.getVentureTotalScore(venture);
    Integer employeeCount = venture.getEmployees().isEmpty()
      ? null
      : venture.getEmployees().get(venture.getEmployees().size() - 1).getCount();

    return new CertificationCriteriaResponse()
      .setProfileCompleted(profileCompleted(venture))
      .setThreePositiveImpacts(venture.getImpacts().stream()
        .filter(Impact::getPositive)
        .filter(this::impactFilled)
        .count() >= 3)
      .setOneNegativeImpact(venture.getImpacts().stream().filter(this::impactFilled).anyMatch(i -> !i.getPositive()))
      .setThreePositiveImpactsScored(venture.getImpacts().stream()
        .filter(Impact::getPositive)
        .filter(impact -> !impact.getScoring().isEmpty())
        .map(i -> calculationService.getScore(i.getScoring().get(i.getScoring().size() - 1), i) != null)
        .count() >= 3)
      .setOneNegativeImpactScored(venture.getImpacts().stream()
        .filter(i -> !i.getPositive())
        .filter(impact -> !impact.getScoring().isEmpty())
        .anyMatch(i -> calculationService.getScore(i.getScoring().get(i.getScoring().size() - 1), i) != null))
      .setMinimumScore15(score >= 15)
      .setThreePositiveForecasts(false)
      .setOneNegativeForecast(false)
      .setOneIndicatorSoon(venture.getImpacts().stream()
        .map(Impact::getIndicators)
        .flatMap(List::stream)
        .anyMatch(i -> i.getYear() != null && i.getYear() <= Year.now().getValue()))
      .setOneIndicatorLongTerm(venture.getImpacts().stream()
        .map(Impact::getIndicators)
        .flatMap(List::stream)
        .anyMatch(i -> i.getYear() != null && i.getYear() >= Year.now().getValue() + 4))
      .setMinimumScore25(score >= 25)
      .setMinimumScore50(score >= 50)
      .setOneYearActual(false)
      .setThreeEsgModules(false)
      .setImpactReportPublished(false)
      .setMinimumScore75(score >= 75)
      .setImmEfficiencyCalculation(false)
      .setThreeYearsActual(false)
      .setFiveEsgModules(false)
      .setPrePostConfidence(false)
      .setMinimumScore150(score >= 150)
      .setSevenEsgModules(false)
      .setMonetizedImpact(false)
      .setNumberOfEmployees(employeeCount != null && employeeCount >= 15);

  }

  public void getCertificationForLevel(Venture venture, Integer level, User user) {
    emailService.sendCertificationRequestEmail(venture, level, user, brandResolver.forCurrentRequest());

    String certificationEmail = brandingProperties.getEmails().getCertify();
    if (StringUtils.isNotEmpty(certificationEmail)) {
      Optional<User> certificationUser = userRepository.findByEmail(certificationEmail);
      certificationUser.ifPresent(userFromConfig -> {
        VentureMemberAccess certificationAccess =
          new VentureMemberAccess(venture, userFromConfig, AccessType.VIEW, InvitationStatus.ACCEPTED);
        ventureMemberAccessRepository.save(certificationAccess);
      });
    }
  }

  private boolean profileCompleted(Venture venture) {
    boolean profileCompleted = StringUtils.isNotEmpty(venture.getName())
      && StringUtils.isNotEmpty(venture.getDescription())
      && venture.getCountry() != null
      && StringUtils.isNotEmpty(venture.getWebsite())
      && StringUtils.isNotEmpty(venture.getReportingPeriod())
      && venture.getCurrency() != null
      && !venture.getIndustries().isEmpty()
      && !venture.getHashtags().isEmpty();

    if (Boolean.TRUE.equals(venture.getLegalEntityFormed())) {
      profileCompleted = venture.getFormationDate() != null
        && StringUtils.isNotEmpty(venture.getProfitOrientation())
        && StringUtils.isNotEmpty(venture.getLegalForm())
        && StringUtils.isNotEmpty(venture.getAddress())
        && StringUtils.isNotEmpty(venture.getCity())
        && StringUtils.isNotEmpty(venture.getZipCode())
        && StringUtils.isNotEmpty(venture.getPhone())
        && venture.getEmployees() != null
        && venture.getVolunteers() != null;
    }

    return profileCompleted;
  }

  private boolean impactFilled(Impact impact) {
    return StringUtils.isNotEmpty(impact.getName())
      && StringUtils.isNotEmpty(impact.getStatusQuo())
      && StringUtils.isNotEmpty(impact.getInnovation())
      && StringUtils.isNotEmpty(impact.getStakeholders())
      && StringUtils.isNotEmpty(impact.getChange())
      && StringUtils.isNotEmpty(impact.getOutputUnits());
  }
}
