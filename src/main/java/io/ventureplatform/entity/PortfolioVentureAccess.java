package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.AccessType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Entity
@Table(
  name = "portfolio_venture_access",
  uniqueConstraints = @UniqueConstraint(columnNames = {"venture_id", "portfolio_id"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class PortfolioVentureAccess extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @ManyToOne
  @JoinColumn(name = "portfolio_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Portfolio portfolio;

  @Enumerated(EnumType.STRING)
  private AccessType access;

  private Boolean hidden;
  private Boolean publicHidden;
}
