package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.QuantificationDataType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "quantification_data")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuantificationData extends BaseEntity {
  private Integer year;
  private Double jan;
  private Double feb;
  private Double mar;
  private Double apr;
  private Double may;
  private Double jun;
  private Double jul;
  private Double aug;
  private Double sep;
  private Double oct;
  private Double nov;
  private Double dec;

  @ManyToOne
  @JoinColumn(name = "impact_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Impact impact;

  @ManyToOne
  @JoinColumn(name = "indicator_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private ImpactIndicator indicator;

  @Enumerated(EnumType.STRING)
  private QuantificationDataType type;
}
