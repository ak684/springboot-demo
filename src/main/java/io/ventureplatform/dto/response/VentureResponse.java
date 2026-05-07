package io.ventureplatform.dto.response;

import com.fasterxml.jackson.annotation.JsonView;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.Industry;
import io.ventureplatform.entity.enums.MeasurementUnit;
import io.ventureplatform.entity.enums.SubscriptionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

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
public class VentureResponse extends BaseResponse {
  private String name;

  private String description;

  //  toDO: do not return impacts with the list of ventures, only when a single one is requested?
  private List<ImpactResponse> impacts = new ArrayList<>();

  private String sortImpactsBy;
  private Boolean legalEntityFormed;
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
  private Boolean active;
  private List<Industry> industries = new ArrayList<>();
  private List<String> hashtags = new ArrayList<>();
  @JsonView(Views.Detailed.class)
  private Set<VentureMemberAccessResponse> members = new HashSet<>();
  @JsonView(Views.Detailed.class)
  private OrganizationResponse organization;
  private Integer certification;
  private VenturePitchSettingsResponse pitchSettings;
  private VenturePublicSettingsResponse publicSettings;
  private boolean facebookConnected;
  private boolean instagramConnected;
  private List<TeamMemberResponse> team = new ArrayList<>();
  private List<AccelerationRecordResponse> acceleration = new ArrayList<>();
  private List<FundingRoundResponse> funding = new ArrayList<>();
  private List<AwardResponse> awards = new ArrayList<>();
  private Boolean hasSubscription;
  private SubscriptionType subscriptionType;
}
