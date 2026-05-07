package io.ventureplatform.dto.response;

import com.fasterxml.jackson.annotation.JsonView;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class PortfolioResponse extends BaseResponse {
  private String name;

  private String description;
  private String mission;

  private Geography country;
  private Date formationDate;
  private String profitOrientation;
  private String legalForm;
  private String address;
  private String city;
  private String region;
  private String zipCode;
  private Double lat;
  private Double lng;
  private String phone;
  private Integer employees;
  private Integer volunteers;
  private String website;
  private String instagram;
  private String twitter;
  private String linkedin;
  private String youtube;
  private String facebook;
  private String reportingPeriod;
  @Enumerated(EnumType.STRING)
  private MeasurementUnit currency;
  private String logo;
  private String streetImage;
  private List<String> hashtags = new ArrayList<>();
  @JsonView(Views.Detailed.class)
  private Set<PortfolioMemberAccessResponse> members = new HashSet<>();
  @JsonView(Views.Detailed.class)
  private OrganizationResponse organization;
  private Integer certification;
  private List<TeamMemberResponse> team = new ArrayList<>();
  private boolean facebookConnected;
  private boolean instagramConnected;
  private String invitationCode;
  private PortfolioPublicSettingsResponse publicSettings;
}
