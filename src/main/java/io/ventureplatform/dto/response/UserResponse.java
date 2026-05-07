package io.ventureplatform.dto.response;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse extends BaseResponse {
  private String email;
  private String name;
  private String lastName;
  private String company;
  private String position;
  private Geography country;
  private String avatar;

  // toDO: Show detailed user information fields only to the user himself (e.g. on endpoints /current, /login)
  private Boolean hasPassword;
  private Boolean googleConnected;
  private Date lastSeen;
  private Long organizationId;
  private UserConfigResponse config;
  private Set<Long> draftVentures = new HashSet<>();
  private Boolean superAdmin;
  private List<Long> publicProfileOnlyCompanyIds = new ArrayList<>();
  private List<PublicProfileCompanyRef> publicProfileOnlyCompanies =
    new ArrayList<>();
  private Map<String, Boolean> featureFlags =
    new HashMap<>();
}
