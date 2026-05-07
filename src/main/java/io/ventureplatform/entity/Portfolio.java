package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.MeasurementUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
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
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderBy;
import javax.persistence.PrimaryKeyJoinColumn;
import javax.persistence.Table;
import javax.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "portfolios")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Portfolio extends BaseEntity {
  @NotEmpty
  private String name;
  private String description;
  private String mission;

  @ManyToOne
  @JoinColumn(name = "organization_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Organization organization;

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
  @OneToMany(mappedBy = "portfolio", orphanRemoval = true)
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<PortfolioEmployeesRecord> employees = new ArrayList<>();
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
  @ElementCollection
  private List<String> hashtags = new ArrayList<>();

  @OneToMany(mappedBy = "portfolio")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  @OrderBy("sortOrder")
  private List<TeamMember> team = new ArrayList<>();

  @Column(columnDefinition = "VARCHAR(1000)")
  private String facebookToken;
  private String facebookCompanyId;
  private String instagramCompanyId;
  private String invitationCode;

  @Column(name = "brand_key", nullable = false, length = 32)
  private String brandKey = "default";

  @OneToMany(mappedBy = "portfolio")
  @Fetch(FetchMode.SUBSELECT)
  @Cascade(CascadeType.ALL)
  private Set<PortfolioVentureAccess> ventures = new HashSet<>();

  @OneToMany(mappedBy = "portfolio")
  private Set<PortfolioMemberAccess> members = new HashSet<>();

  @OneToOne(mappedBy = "portfolio", cascade = javax.persistence.CascadeType.ALL)
  @PrimaryKeyJoinColumn
  private PortfolioPublicSettings publicSettings = new PortfolioPublicSettings();
}
