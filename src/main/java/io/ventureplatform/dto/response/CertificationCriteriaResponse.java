package io.ventureplatform.dto.response;

import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class CertificationCriteriaResponse {
  // Level 1
  private boolean profileCompleted;
  private boolean threePositiveImpacts;
  private boolean oneNegativeImpact;
  private boolean threePositiveImpactsScored;
  private boolean oneNegativeImpactScored;
  private boolean minimumScore15;

  // Level 2
  private boolean threePositiveForecasts;
  private boolean oneNegativeForecast;
  private boolean oneIndicatorSoon;
  private boolean oneIndicatorLongTerm;
  private boolean minimumScore25;

  // Level 3
  private boolean minimumScore50;
  private boolean oneYearActual;
  private boolean threeEsgModules;
  private boolean impactReportPublished;

  // Level 4
  private boolean minimumScore75;
  private boolean immEfficiencyCalculation;
  private boolean threeYearsActual;
  private boolean fiveEsgModules;
  private boolean prePostConfidence;

  // Level 5
  private boolean minimumScore150;
  private boolean sevenEsgModules;
  private boolean monetizedImpact;
  private boolean numberOfEmployees;
}
