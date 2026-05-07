package io.ventureplatform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.UserRole;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.PrimaryKeyJoinColumn;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class User extends BaseEntity {
  @Column(unique = true)
  @NotEmpty
  private String email;

  private String name;
  private String lastName;
  private String company;
  private String position;

  private String password;

  @Enumerated(EnumType.STRING)
  @NotNull
  private UserRole role = UserRole.ROLE_USER;

  @ManyToOne
  @JoinColumn(name = "organization_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Organization organization;

  @ElementCollection
  private Set<String> customerIds = new HashSet<>();
  @Enumerated(EnumType.STRING)
  private Geography country;

  @Column(name = "home_brand_key", nullable = false, length = 32)
  private String homeBrandKey = "default";

  private String passwordResetToken;
  private Long tokenExpiryDate;
  private String avatar;
  private Date lastSeen;
  private String googleToken;
  private String googleRefreshToken;
  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
  @PrimaryKeyJoinColumn
  private UserConfig config = new UserConfig();

  @OneToMany(mappedBy = "member")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Set<VentureMemberAccess> ventures = new HashSet<>();

  @OneToMany(mappedBy = "member")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Set<PortfolioMemberAccess> portfolios = new HashSet<>();

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  @Fetch(FetchMode.SUBSELECT)
  private Set<UserVentureDraft> draftVentures = new HashSet<>();

  @Transient
  @JsonProperty
  @Getter(AccessLevel.NONE)
  private Boolean hasPassword = false;

  public Boolean getHasPassword() {
    return password != null;
  }

  @Transient
  @JsonProperty
  @Getter(AccessLevel.NONE)
  private Boolean googleConnected = false;

  public Boolean getGoogleConnected() {
    return googleToken != null;
  }
}
