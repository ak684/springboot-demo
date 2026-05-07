package io.ventureplatform.mapper;

import io.ventureplatform.dto.response.ImpactResponse;
import io.ventureplatform.dto.response.NoteFileResponse;
import io.ventureplatform.dto.response.PortfolioResponse;
import io.ventureplatform.dto.response.PublicProfileCompanyRef;
import io.ventureplatform.dto.response.UserResponse;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.NoteFile;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.UserVentureDraft;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.configuration.FeatureProperties;
import io.ventureplatform.configuration.SuperAdminConfiguration;
import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.repository.CompanyMemberAccessRepository;
import io.ventureplatform.service.CalculationService;
import io.ventureplatform.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeMap;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
public class PropertyMappingConfig {
  private final ModelMapper mapper;
  private final CalculationService calculationService;
  private final SecurityService securityService;
  private final SuperAdminConfiguration superAdminConfiguration;
  private final FeatureProperties featureProperties;
  private final CompanyMemberAccessRepository companyMemberAccessRepository;

  @PostConstruct
  private void setupMapper() {
    TypeMap<Impact, ImpactResponse> impactMapper = mapper.createTypeMap(Impact.class, ImpactResponse.class);
    impactMapper.setPostConverter(impactToDtoConverter());
    TypeMap<User, UserResponse> userMapper = mapper.createTypeMap(User.class, UserResponse.class);
    userMapper.setPostConverter(userToDtoConverter());
    TypeMap<NoteFile, NoteFileResponse> noteFileMapper = mapper.createTypeMap(NoteFile.class, NoteFileResponse.class);
    noteFileMapper.setPostConverter(noteFileToDtoConverter());
    TypeMap<Venture, VentureResponse> ventureMapper = mapper.createTypeMap(Venture.class, VentureResponse.class);
    ventureMapper.addMappings(m -> m.skip(VentureResponse::setEmployees));
    ventureMapper.setPostConverter(ventureToDtoConverter());
    TypeMap<Portfolio, PortfolioResponse> portfolioMapper =
      mapper.createTypeMap(Portfolio.class, PortfolioResponse.class);
    portfolioMapper.addMappings(m -> m.skip(PortfolioResponse::setEmployees));
    portfolioMapper.setPostConverter(portfolioToDtoConverter());
    TypeMap<UserVentureDraft, Long> userVentureDraftMapper = mapper.createTypeMap(UserVentureDraft.class, Long.class);
    userVentureDraftMapper.setPostConverter(userVentureDraftToDtoConverter());
  }

  private Converter<Impact, ImpactResponse> impactToDtoConverter() {
    return context -> {
      Impact source = context.getSource();
      ImpactResponse destination = context.getDestination();
      for (int i = 0; i < source.getScoring().size(); i++) {
        destination.getScoring().get(i).setMagnitude(calculationService.getMagnitude(source.getScoring().get(i)));
        destination.getScoring().get(i).setLikelihood(calculationService.getLikelihood(source.getScoring().get(i)));
        destination.getScoring().get(i).setScore(calculationService.getScore(source.getScoring().get(i), source));
      }
      return destination;
    };
  }

  private Converter<User, UserResponse> userToDtoConverter() {
    return context -> {
      User source = context.getSource();
      UserResponse destination = context.getDestination();
      if (source.getOrganization() != null) {
        destination.setOrganizationId(source.getOrganization().getId());
      }
      String email = source.getEmail();
      boolean isSuperAdmin =
        superAdminConfiguration.isSuperAdmin(email);
      destination.setSuperAdmin(isSuperAdmin);

      Map<String, Boolean> flags = new HashMap<>();
      flags.put(
        "researchDatabase",
        featureProperties
          .isResearchDatabaseEnabled(email)
      );
      destination.setFeatureFlags(flags);

      if (source.getId() != null) {
        List<PublicProfileCompanyRef> refs = companyMemberAccessRepository
          .findByMemberId(source.getId())
          .stream()
          .filter(a -> AccessType.PUBLIC_PROFILE_ONLY.equals(a.getAccess()))
          .map(a -> new PublicProfileCompanyRef(
            a.getCompany().getId(),
            a.getCompany().getCompanyName(),
            a.getCompany().getCompanyLogo(),
            a.getCompany().getCompanyDescription()))
          .collect(Collectors.toList());
        destination.setPublicProfileOnlyCompanies(refs);
        destination.setPublicProfileOnlyCompanyIds(
          refs.stream().map(PublicProfileCompanyRef::getId).collect(Collectors.toList()));
      }
      return destination;
    };
  }

  private Converter<NoteFile, NoteFileResponse> noteFileToDtoConverter() {
    return context -> {
      NoteFile source = context.getSource();
      NoteFileResponse destination = context.getDestination();
      Venture venture = source.getNote().getImpact().getVenture();

      if ((securityService.userAuthenticated()
        || (Boolean.TRUE.equals(venture.getPitchSettings().getShared())
        && Boolean.TRUE.equals(venture.getPitchSettings().getAllowDownloadFiles()))) && source.getKey() != null
      ) {
        destination.setDownloadable(true);
      }
      return destination;
    };
  }

  private Converter<Venture, VentureResponse> ventureToDtoConverter() {
    return context -> {
      Venture source = context.getSource();
      VentureResponse destination = context.getDestination();
      destination.setFacebookConnected(
        StringUtils.hasLength(source.getFacebookToken()) && StringUtils.hasLength(source.getFacebookCompanyId())
      );
      destination.setInstagramConnected(
        StringUtils.hasLength(source.getFacebookToken()) && StringUtils.hasLength(source.getInstagramCompanyId())
      );
      destination.setEmployees(
        source.getEmployees().isEmpty() ? null : source.getEmployees().get(source.getEmployees().size() - 1).getCount()
      );

      return destination;
    };
  }

  private Converter<Portfolio, PortfolioResponse> portfolioToDtoConverter() {
    return context -> {
      Portfolio source = context.getSource();
      PortfolioResponse destination = context.getDestination();
      destination.setFacebookConnected(
        StringUtils.hasLength(source.getFacebookToken()) && StringUtils.hasLength(source.getFacebookCompanyId())
      );
      destination.setInstagramConnected(
        StringUtils.hasLength(source.getFacebookToken()) && StringUtils.hasLength(source.getInstagramCompanyId())
      );
      destination.setEmployees(
        source.getEmployees().isEmpty() ? null : source.getEmployees().get(source.getEmployees().size() - 1).getCount()
      );
      return destination;
    };
  }

  private Converter<UserVentureDraft, Long> userVentureDraftToDtoConverter() {
    return context -> {
      UserVentureDraft source = context.getSource();
      return source.getVenture().getId();
    };
  }
}
