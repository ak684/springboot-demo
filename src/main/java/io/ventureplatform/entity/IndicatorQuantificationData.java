package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.IndicatorQuantificationType;
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
@Table(name = "indicator_quantification_data")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class IndicatorQuantificationData extends BaseEntity {
  private Integer year;
  private Double value;

  @ManyToOne
  @JoinColumn(name = "indicator_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private ImpactIndicator indicator;

  @Enumerated(EnumType.STRING)
  private IndicatorQuantificationType type;
}
