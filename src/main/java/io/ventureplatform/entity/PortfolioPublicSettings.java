package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.persistence.Table;

@Entity
@Table(name = "portfolio_public_settings")
@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioPublicSettings {
  @Id
  private Long portfolioId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "portfolio_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;

  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean shared;
  private String missionImage;
}
