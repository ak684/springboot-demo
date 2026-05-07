package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.validation.constraints.Email;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class InviteUserRequest {
  private String name;
  private String lastName;
  @Email
  private String email;
  private List<VentureMemberAccessRequest> ventures = new ArrayList<>();
  private List<PortfolioMemberAccessRequest> portfolios = new ArrayList<>();
  private List<CompanyMemberAccessRequest> companies = new ArrayList<>();
  private String message;
}
