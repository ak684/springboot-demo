package io.ventureplatform.dto.request;

import io.ventureplatform.entity.enums.Duration;
import io.ventureplatform.entity.enums.DurationNegative;
import io.ventureplatform.entity.enums.Geography;
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

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImpactScoreRequest extends BaseRequest {
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
  private Integer contribution;
  private String contributionExplanation;
  @Valid
  private List<IndicatorScoreRequest> indicatorScores = new ArrayList<>();
  @Valid
  private List<ImpactGoalRequest> goals = new ArrayList<>();
  private List<Geography> geography = new ArrayList<>();
  private List<String> geographyCustom = new ArrayList<>();
}
