package io.ventureplatform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserConfigResponse {
  private Boolean hideImpactWizard;
  private Boolean hideScoringWizard;
  private Boolean hideTeamManagementWizard;
  private Boolean hideQuantificationWizard;
  private Boolean hideMonitoringWizard;
}
