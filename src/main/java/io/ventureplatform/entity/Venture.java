package io.ventureplatform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.Industry;
import io.ventureplatform.entity.enums.MeasurementUnit;
import io.ventureplatform.entity.enums.SubscriptionType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderBy;
import javax.persistence.PrimaryKeyJoinColumn;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "ventures")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Venture extends BaseEntity {
  @NotEmpty
  private String name;
  private String description;

  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("sortOrder")
  @Cascade(CascadeType.ALL)
  private List<Impact> impacts = new ArrayList<>();

  @ManyToOne
  @JoinColumn(name = "organization_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Organization organization;

  @Column(name = "sort_impacts_by", columnDefinition = "VARCHAR(20) default 'score'")
  private String sortImpactsBy = "score";

  private Boolean legalEntityFormed;
  @Enumerated(EnumType.STRING)
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
  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<VentureEmployeesRecord> employees = new ArrayList<>();
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
  @Column(columnDefinition = "TEXT")
  private String geography;

  private Boolean active = false;
  private String subscriptionId;
  @Enumerated(EnumType.STRING)
  private SubscriptionType subscriptionType;

  @ElementCollection
  @Enumerated(EnumType.STRING)
  private List<Industry> industries = new ArrayList<>();
  @ElementCollection
  private List<String> hashtags = new ArrayList<>();

  @Column(columnDefinition = "integer DEFAULT 0")
  private Integer certification = 0;

  @OneToOne(mappedBy = "venture", cascade = javax.persistence.CascadeType.ALL)
  @PrimaryKeyJoinColumn
  private VenturePitchSettings pitchSettings = new VenturePitchSettings();

  @OneToOne(mappedBy = "venture", cascade = javax.persistence.CascadeType.ALL)
  @PrimaryKeyJoinColumn
  private VenturePublicSettings publicSettings = new VenturePublicSettings();

  @Column(columnDefinition = "VARCHAR(1000)")
  private String facebookToken;
  private String facebookCompanyId;
  private String instagramCompanyId;
  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  @OrderBy("sortOrder")
  private List<TeamMember> team = new ArrayList<>();
  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private List<AccelerationRecord> acceleration = new ArrayList<>();
  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private List<FundingRound> funding = new ArrayList<>();
  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private List<Award> awards = new ArrayList<>();

  @OneToMany(mappedBy = "venture")
  private Set<PortfolioVentureAccess> portfolios = new HashSet<>();
  @OneToMany(mappedBy = "venture")
  private Set<VentureMemberAccess> members = new HashSet<>();

  @OneToMany(mappedBy = "venture")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private List<Followers> followers = new ArrayList<>();

  @Transient
  @JsonProperty
  @Getter(AccessLevel.NONE)
  private Boolean hasSubscription = false;

  public Boolean getHasSubscription() {
    return subscriptionId != null;
  }
}
