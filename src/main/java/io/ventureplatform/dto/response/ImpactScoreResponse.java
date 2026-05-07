package io.ventureplatform.dto.response;

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
import lombok.experimental.Accessors;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class ImpactScoreResponse extends BaseResponse {
  private Integer degreeOfChange;
  private String degreeOfChangeExplanation;
  private Duration duration;
  private DurationNegative durationNegative;
  private String durationExplanation;
  private PreviousEvidence previousEvidence;
  private PreviousEvidenceNegative previousEvidenceNegative;
  private String previousEvidenceExplanation;
  private ProblemImportance problemImportance;
  private ProblemImportanceNegative problemImportanceNegative;
  private String problemImportanceExplanation;
  private Proximity proximity;
  private String proximityExplanation;
  private SizeOfStakeholders sizeOfStakeholders;
  private SizeOfStakeholdersNegative sizeOfStakeholdersNegative;
  private String sizeOfStakeholdersExplanation;
  private StakeholderSituation stakeholderSituation;
  private StakeholderSituationNegative stakeholderSituationNegative;
  private String stakeholderSituationExplanation;
  private List<IndicatorScoreResponse> indicatorScores;
  private Integer contribution;
  private String contributionExplanation;

  private Double magnitude;
  private Double likelihood;
  private Double score;
}
