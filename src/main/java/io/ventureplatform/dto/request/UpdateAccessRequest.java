package io.ventureplatform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateAccessRequest {
  @NotEmpty
  private String email;
  private List<VentureMemberAccessRequest> addedVentures = new ArrayList<>();
  private List<VentureMemberAccessRequest> removedVentures = new ArrayList<>();
  private List<PortfolioMemberAccessRequest> addedPortfolios = new ArrayList<>();
  private List<PortfolioMemberAccessRequest> removedPortfolios = new ArrayList<>();
}
