package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.entity.enums.Contribution;
import io.ventureplatform.entity.enums.ContributionNegative;
import io.ventureplatform.entity.enums.DegreeOfChange;
import io.ventureplatform.entity.enums.DegreeOfChangeNegative;
import io.ventureplatform.entity.enums.Duration;
import io.ventureplatform.entity.enums.DurationNegative;
import io.ventureplatform.entity.enums.FundingRoundType;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.IndicatorNoisiness;
import io.ventureplatform.entity.enums.IndicatorPitchView;
import io.ventureplatform.entity.enums.IndicatorPublicView;
import io.ventureplatform.entity.enums.IndicatorValidation;
import io.ventureplatform.entity.enums.Industry;
import io.ventureplatform.entity.enums.MeasurementUnit;
import io.ventureplatform.entity.enums.PreviousEvidence;
import io.ventureplatform.entity.enums.PreviousEvidenceNegative;
import io.ventureplatform.entity.enums.ProblemImportance;
import io.ventureplatform.entity.enums.ProblemImportanceNegative;
import io.ventureplatform.entity.enums.Proximity;
import io.ventureplatform.entity.enums.ScoringIndicator;
import io.ventureplatform.entity.enums.SizeOfStakeholders;
import io.ventureplatform.entity.enums.SizeOfStakeholdersNegative;
import io.ventureplatform.entity.enums.StakeholderSituation;
import io.ventureplatform.entity.enums.StakeholderSituationNegative;
import io.ventureplatform.entity.enums.SustainableDevelopmentGoal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/dictionaries")
@RequiredArgsConstructor
public class DictionaryController {
  @GetMapping("goals")
  public ResponseEntity<SustainableDevelopmentGoal[]> getGoals() {
    return ResponseEntity.ok(SustainableDevelopmentGoal.values());
  }

  @PreAuthorize("isAuthenticated()")
  @GetMapping("scoring")
  public ResponseEntity<Map<String, ScoringIndicator[]>> getScoringQuestions() {
    Map<String, ScoringIndicator[]> response = new HashMap<>() {
      {
        put("degreeOfChange", DegreeOfChange.values());
        put("degreeOfChangeNegative", DegreeOfChangeNegative.values());
        put("duration", Duration.values());
        put("durationNegative", DurationNegative.values());
        put("noisiness", IndicatorNoisiness.values());
        put("previousEvidence", PreviousEvidence.values());
        put("previousEvidenceNegative", PreviousEvidenceNegative.values());
        put("problemImportance", ProblemImportance.values());
        put("problemImportanceNegative", ProblemImportanceNegative.values());
        put("proximity", Proximity.values());
        put("sizeOfStakeholders", SizeOfStakeholders.values());
        put("sizeOfStakeholdersNegative", SizeOfStakeholdersNegative.values());
        put("stakeholderSituation", StakeholderSituation.values());
        put("stakeholderSituationNegative", StakeholderSituationNegative.values());
        put("validation", IndicatorValidation.values());
        put("contribution", Contribution.values());
        put("contributionNegative", ContributionNegative.values());
      }
    };

    return ResponseEntity.ok(response);
  }

  @GetMapping("geography")
  public ResponseEntity<Geography[]> getGeography() {
    return ResponseEntity.ok(Geography.values());
  }

  @GetMapping("industries")
  public ResponseEntity<Industry[]> getIndustries() {
    return ResponseEntity.ok(Industry.values());
  }

  @GetMapping("units")
  public ResponseEntity<MeasurementUnit[]> getUnits() {
    return ResponseEntity.ok(MeasurementUnit.values());
  }

  @GetMapping("funding-rounds")
  public ResponseEntity<FundingRoundType[]> getFundingRoundTypes() {
    return ResponseEntity.ok(FundingRoundType.values());
  }

  @GetMapping("indicator-pitch-view")
  public ResponseEntity<IndicatorPitchView[]> getIndicatorPitchViews() {
    return ResponseEntity.ok(IndicatorPitchView.values());
  }

  @GetMapping("indicator-public-view")
  public ResponseEntity<IndicatorPublicView[]> getIndicatorPublicViews() {
    return ResponseEntity.ok(IndicatorPublicView.values());
  }
}
