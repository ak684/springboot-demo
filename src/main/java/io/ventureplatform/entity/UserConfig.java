package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.persistence.Table;

@Entity
@Table(name = "user_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserConfig {
  @Id
  @Column(name = "user_id")
  private Long id;

  @OneToOne
  @MapsId
  @JoinColumn(name = "user_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private User user;

  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean hideImpactWizard = false;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean hideScoringWizard = false;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean hideTeamManagementWizard = false;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean hideQuantificationWizard = false;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean hideMonitoringWizard = false;
}
