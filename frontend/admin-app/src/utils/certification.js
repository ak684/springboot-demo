export const criteriaAchieved = (achieved, ...criteria) => criteria.every(c => !!achieved[c]);

export const countCriteriaAchieved = (achieved, ...criteria) => criteria.filter(c => !!achieved[c]).length;

export const certificationSteps = {
  1: ['profileCompleted', 'threePositiveImpacts', 'oneNegativeImpact', 'threePositiveImpactsScored', 'oneNegativeImpactScored', 'minimumScore15'],
  2: ['threePositiveForecasts', 'oneNegativeForecast', 'oneIndicatorSoon', 'oneIndicatorLongTerm', 'minimumScore25'],
  3: ['minimumScore50', 'oneYearActual', 'threeEsgModules', 'impactReportPublished'],
  4: ['minimumScore75', 'immEfficiencyCalculation', 'threeYearsActual', 'fiveEsgModules', 'prePostConfidence'],
  5: ['minimumScore150', 'sevenEsgModules', 'monetizedImpact', 'numberOfEmployees']
};
