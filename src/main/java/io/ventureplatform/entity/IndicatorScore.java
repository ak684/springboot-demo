package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.IndicatorNoisiness;
import io.ventureplatform.entity.enums.IndicatorValidation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "indicator_scores")
@Data
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class IndicatorScore extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "impact_score_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private ImpactScore impactScore;

  @ManyToOne
  @JoinColumn(name = "impact_indicator_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private ImpactIndicator indicator;

  @Enumerated(value = EnumType.STRING)
  private IndicatorValidation validation;
  @Column(columnDefinition = "TEXT")
  private String validationExplanation;
  @Enumerated(value = EnumType.STRING)
  private IndicatorNoisiness noisiness;
  @Column(columnDefinition = "TEXT")
  private String noisinessExplanation;
}
