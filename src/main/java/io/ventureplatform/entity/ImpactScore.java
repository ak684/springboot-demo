package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.Duration;
import io.ventureplatform.entity.enums.DurationNegative;
import io.ventureplatform.entity.enums.PreviousEvidence;
import io.ventureplatform.entity.enums.PreviousEvidenceNegative;
import io.ventureplatform.entity.enums.ProblemImportance;
import io.ventureplatform.entity.enums.ProblemImportanceNegative;
import io.ventureplatform.entity.enums.Proximity;
import io.ventureplatform.entity.enums.SizeOfStakeholders;
import io.ventureplatform.entity.enums.SizeOfStakeholdersNegative;
import io.ventureplatform.entity.enums.StakeholderSituation;
import io.ventureplatform.entity.enums.StakeholderSituationNegative;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "impact_scores")
@Data
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ImpactScore extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "impact_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Impact impact;

  private Integer degreeOfChange;
  @Column(columnDefinition = "TEXT")
  private String degreeOfChangeExplanation;
  @Enumerated(value = EnumType.STRING)
  private Duration duration;
  @Enumerated(value = EnumType.STRING)
  private DurationNegative durationNegative;
  @Column(columnDefinition = "TEXT")
  private String durationExplanation;
  @Enumerated(value = EnumType.STRING)
  private PreviousEvidence previousEvidence;
  @Enumerated(value = EnumType.STRING)
  private PreviousEvidenceNegative previousEvidenceNegative;
  @Column(columnDefinition = "TEXT")
  private String previousEvidenceExplanation;
  @Enumerated(value = EnumType.STRING)
  private ProblemImportance problemImportance;
  @Enumerated(value = EnumType.STRING)
  private ProblemImportanceNegative problemImportanceNegative;
  @Column(columnDefinition = "TEXT")
  private String problemImportanceExplanation;
  @Enumerated(value = EnumType.STRING)
  private Proximity proximity;
  @Column(columnDefinition = "TEXT")
  private String proximityExplanation;
  @Enumerated(value = EnumType.STRING)
  private SizeOfStakeholders sizeOfStakeholders;
  @Enumerated(value = EnumType.STRING)
  private SizeOfStakeholdersNegative sizeOfStakeholdersNegative;
  @Column(columnDefinition = "TEXT")
  private String sizeOfStakeholdersExplanation;
  @Enumerated(value = EnumType.STRING)
  private StakeholderSituation stakeholderSituation;
  @Enumerated(value = EnumType.STRING)
  private StakeholderSituationNegative stakeholderSituationNegative;
  @Column(columnDefinition = "TEXT")
  private String stakeholderSituationExplanation;
  private Integer contribution;
  @Column(columnDefinition = "TEXT")
  private String contributionExplanation;

  @OneToMany(mappedBy = "impactScore")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<IndicatorScore> indicatorScores = new ArrayList<>();
}
