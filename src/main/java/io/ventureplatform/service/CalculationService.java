package io.ventureplatform.service;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.IndicatorScore;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.ImpactSort;
import io.ventureplatform.entity.enums.IndicatorNoisiness;
import io.ventureplatform.entity.enums.IndicatorValidation;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CalculationService {
  public Double getMagnitude(ImpactScore score) {
    if (score.getImpact().getPositive()) {
      if (fieldsFilled(
        score.getProblemImportance(),
        score.getStakeholderSituation(),
        score.getDegreeOfChange(),
        score.getDuration(),
        score.getSizeOfStakeholders(),
        score.getContribution()
      )
      ) {
        Double importance = (score.getProblemImportance().getScore() * 2 / 3
          + score.getStakeholderSituation().getScore() * 1 / 3) * 20;
        Double howMuchSolved =
          ((1 + score.getDegreeOfChange() * 9.0d / 100) * 6 / 7 + score.getDuration().getScore() * 2 / 7) / 10;
        double contribution = (1 + score.getContribution() * 9.0d / 100) / 10;
        return importance * howMuchSolved * score.getSizeOfStakeholders().getScore() / 10 * contribution;
      }
    } else {
      if (fieldsFilled(
        score.getProblemImportanceNegative(),
        score.getStakeholderSituationNegative(),
        score.getDegreeOfChange(),
        score.getDurationNegative(),
        score.getSizeOfStakeholdersNegative(),
        score.getContribution()
      )
      ) {
        Double importance = (score.getProblemImportanceNegative().getScore() * 2 / 3
          + score.getStakeholderSituationNegative().getScore() * 1 / 3) * 20;
        Double howMuchSolved = ((1 + score.getDegreeOfChange() * 9 / 100) * 6 / 7
          + score.getDurationNegative().getScore() * 2 / 7) / 10;
        double contribution = (1 + score.getContribution() * 9.0d / 100) / 10;
        return importance * howMuchSolved * score.getSizeOfStakeholdersNegative().getScore() / 10 * contribution;
      }
    }

    return null;
  }

  public Double getLikelihood(ImpactScore score) {
    if (score.getImpact().getPositive()) {
      if (fieldsFilled(score.getPreviousEvidence(), score.getProximity())) {
        List<IndicatorScore> indicatorScores = score.getIndicatorScores().stream()
          .filter(is -> fieldsFilled(is.getNoisiness(), is.getValidation()))
          .toList();

        if (indicatorScores.isEmpty()) {
          return (score.getPreviousEvidence().getScore() + score.getProximity().getScore()) * 10;
        } else {
          Double noisiness = indicatorScores.stream()
            .map(IndicatorScore::getNoisiness)
            .map(IndicatorNoisiness::getScore)
            .collect(Collectors.summarizingDouble(Double::doubleValue))
            .getAverage();
          Double validation = indicatorScores.stream()
            .map(IndicatorScore::getValidation)
            .map(IndicatorValidation::getScore)
            .collect(Collectors.summarizingDouble(Double::doubleValue))
            .getAverage();
          return (score.getPreviousEvidence().getScore() + score.getProximity().getScore() + noisiness + validation)
            * 5;
        }
      }
    } else {
      if (score.getPreviousEvidenceNegative() != null) {
        return score.getPreviousEvidenceNegative().getScore() * 20;
      }
    }

    return null;
  }

  public Double getScore(ImpactScore score, Impact impact) {
    Double magnitude = getMagnitude(score);
    Double likelihood = getLikelihood(score);
    if (fieldsFilled(magnitude, likelihood)) {
      return magnitude * likelihood / 100;
    }

    return null;
  }

  private boolean fieldsFilled(Object... fields) {
    return Arrays.stream(fields).allMatch(Objects::nonNull);
  }

  public Double getParam(ImpactScore score, ImpactSort sort, Impact impact) {
    if (score == null) {
      return null;
    }

    if (sort == ImpactSort.BY_SCORE || sort == ImpactSort.CUSTOM) {
      return getScore(score, impact);
    } else if (sort == ImpactSort.BY_MAGNITUDE) {
      return getMagnitude(score);
    } else if (sort == ImpactSort.BY_LIKELIHOOD) {
      return getLikelihood(score);
    }

    return null;
  }

  public Double getVentureTotalMagnitude(Venture venture) {
    List<Impact> finalScoredImpacts = venture.getImpacts().stream()
      .filter(i -> !i.getDraft())
      .filter(i -> i.getScoring().size() > 0 && getScore(i.getScoring().get(i.getScoring().size() - 1), i) != null)
      .toList();

    Double positiveMagnitude = finalScoredImpacts.stream()
      .filter(Impact::getPositive)
      .sorted((i1, i2) -> Double.compare(getScore(i2.getScoring().get(i2.getScoring().size() - 1), i2),
        getScore(i1.getScoring().get(i1.getScoring().size() - 1), i1)))
      .limit(5)
      .mapToDouble(i -> getMagnitude(i.getScoring().get(i.getScoring().size() - 1)))
      .sum();

    Double negativeMagnitude = finalScoredImpacts.stream()
      .filter(i -> !i.getPositive())
      .sorted((i1, i2) -> Double.compare(getScore(i2.getScoring().get(i2.getScoring().size() - 1), i2),
        getScore(i1.getScoring().get(i1.getScoring().size() - 1), i1)))
      .limit(2)
      .mapToDouble(i -> getMagnitude(i.getScoring().get(i.getScoring().size() - 1)))
      .sum();

    return Math.min(Math.max(positiveMagnitude - negativeMagnitude, -500), 500);
  }

  public Double getVentureTotalLikelihood(Venture venture) {
    Double magnitude = getVentureTotalMagnitude(venture);
    Double score = getVentureTotalScore(venture);
    if (fieldsFilled(magnitude, score)) {
      return score / magnitude * 100;
    }

    return 0D;
  }

  public Double getVentureTotalScore(Venture venture) {
    List<Impact> finalScoredImpacts = venture.getImpacts().stream()
      .filter(i -> !i.getDraft())
      .filter(i -> i.getScoring().size() > 0 && getScore(i.getScoring().get(i.getScoring().size() - 1), i) != null)
      .toList();

    Double positiveScore = finalScoredImpacts.stream()
      .filter(Impact::getPositive)
      .sorted((i1, i2) -> Double.compare(getScore(i2.getScoring().get(i2.getScoring().size() - 1), i2),
        getScore(i1.getScoring().get(i1.getScoring().size() - 1), i1)))
      .limit(5)
      .mapToDouble(i -> getScore(i.getScoring().get(i.getScoring().size() - 1), i))
      .sum();

    Double negativeScore = finalScoredImpacts.stream()
      .filter(i -> !i.getPositive())
      .sorted((i1, i2) -> Double.compare(getScore(i2.getScoring().get(i2.getScoring().size() - 1), i2),
        getScore(i1.getScoring().get(i1.getScoring().size() - 1), i1)))
      .limit(2)
      .mapToDouble(i -> getScore(i.getScoring().get(i.getScoring().size() - 1), i))
      .sum();

    return Math.min(Math.max(positiveScore - negativeScore, -500), 500);
  }
}
