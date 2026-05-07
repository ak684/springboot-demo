package io.ventureplatform.service;

import io.ventureplatform.dto.response.ImpactScoreResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.enums.Duration;
import io.ventureplatform.entity.enums.DurationNegative;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class ImpactScoreService extends AbstractBaseEntityService<ImpactScore> {
  private final CalculationService calculationService;

  public ImpactScoreResponse getScore(ImpactScore impactScore, Impact impact) {
    impactScore.setImpact(impact);
    ImpactScoreResponse response = new ImpactScoreResponse();
    return response
      .setLikelihood(calculationService.getLikelihood(impactScore))
      .setMagnitude(calculationService.getMagnitude(impactScore))
      .setScore(calculationService.getScore(impactScore, impact));
  }

  public Map<String, Double> getImprovementPotential(Impact impact) {
    Map<String, Double> result = new HashMap<>();

    if (!impact.getScoring().isEmpty() && impact.getScoring().get(impact.getScoring().size() - 1) != null) {
      ImpactScore score = impact.getScoring().get(impact.getScoring().size() - 1);
      Double scoreValue = calculationService.getScore(score, impact);

      if (impact.getPositive()) {
        getScoreForMaxValue(impact, score, result, scoreValue, score::getStakeholderSituation,
          score::setStakeholderSituation, StakeholderSituation.values(), "stakeholderSituation");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getProblemImportance,
          score::setProblemImportance, ProblemImportance.values(), "problemImportance");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getDuration,
          score::setDuration, Duration.values(), "duration");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getPreviousEvidence,
          score::setPreviousEvidence, PreviousEvidence.values(), "previousEvidence");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getSizeOfStakeholders,
          score::setSizeOfStakeholders, SizeOfStakeholders.values(), "sizeOfStakeholders");
      } else {
        getScoreForMaxValue(impact, score, result, scoreValue, score::getStakeholderSituationNegative,
          score::setStakeholderSituationNegative, StakeholderSituationNegative.values(),
          "stakeholderSituation");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getProblemImportanceNegative,
          score::setProblemImportanceNegative, ProblemImportanceNegative.values(), "problemImportance");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getDurationNegative,
          score::setDurationNegative, DurationNegative.values(), "duration");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getPreviousEvidenceNegative,
          score::setPreviousEvidenceNegative, PreviousEvidenceNegative.values(), "previousEvidence");
        getScoreForMaxValue(impact, score, result, scoreValue, score::getSizeOfStakeholdersNegative,
          score::setSizeOfStakeholdersNegative, SizeOfStakeholdersNegative.values(), "sizeOfStakeholders");
      }
      getScoreForMaxInteger(impact, score, result, scoreValue, score::getDegreeOfChange,
        score::setDegreeOfChange, 100, "degreeOfChange");
      getScoreForMaxInteger(impact, score, result, scoreValue, score::getContribution,
        score::setContribution, 100, "contribution");
      getScoreForMaxValue(impact, score, result, scoreValue, score::getProximity,
        score::setProximity, Proximity.values(), "proximity");
    }

    return result;
  }

  private <T extends ScoringIndicator> void getScoreForMaxValue(
    Impact impact,
    ImpactScore score,
    Map<String, Double> result,
    Double scoreValue,
    Supplier<T> getter,
    Consumer<T> setter,
    T[] values,
    String propName
  ) {
    T initial = getter.get();
    setter.accept(values[values.length - 1]);
    Double updatedScore = calculationService.getScore(score, impact);
    result.put(propName, updatedScore - scoreValue);
    setter.accept(initial);
  }

  private void getScoreForMaxInteger(
    Impact impact,
    ImpactScore score,
    Map<String, Double> result,
    Double scoreValue,
    Supplier<Integer> getter,
    Consumer<Integer> setter,
    Integer max,
    String propName
  ) {
    Integer initial = getter.get();
    setter.accept(max);
    Double updatedScore = calculationService.getScore(score, impact);
    result.put(propName, updatedScore - scoreValue);
    setter.accept(initial);
  }
}
