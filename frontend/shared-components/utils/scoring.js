import moment from 'moment';
import { clone, distinct, isDefined } from './lo';
import { arraySum } from './helpers';

export const getVenturePositiveValues = (venture, until, param = 'score', impacts) => {
  const finalImpacts = venture?.impacts.filter(i => !i.draft);
  return (impacts || finalImpacts)
    .filter(i => i.scoring?.at(-1)?.score)
    .filter(i => i.positive)
    .map(i => until ? i.scoring.findLast(s => s.score && new Date(s.createdAt) < new Date(until)) : i.scoring.at(-1))
    .filter(isDefined)
    .sort((s1, s2) => s2.score - s1.score)
    .slice(0, 5)
    .map(s => s[param]);
};

export const getVentureNegativeValues = (venture, until, param = 'score', impacts) => {
  const finalImpacts = venture?.impacts.filter(i => !i.draft);
  return (impacts || finalImpacts)
    .filter(i => i.scoring?.at(-1)?.score)
    .filter(i => !i.positive)
    .map(i => until ? i.scoring.findLast(s => s.score && new Date(s.createdAt) < new Date(until)) : i.scoring.at(-1))
    .filter(isDefined)
    .sort((s1, s2) => s2.score - s1.score)
    .slice(0, 2)
    .map(s => s[param]);
};
export const getVentureTotalScore = (venture, until, impacts) => {
  const raw = arraySum(getVenturePositiveValues(venture, until, undefined, impacts))
    - arraySum(getVentureNegativeValues(venture, until, undefined, impacts));
  return Number(Math.max(Math.min(raw, 500), -500).toFixed(0));
};

export const getVentureTotalMagnitude = (venture, until, impacts) => {
  const raw = arraySum(getVenturePositiveValues(venture, until, 'magnitude', impacts))
    - arraySum(getVentureNegativeValues(venture, until, 'magnitude', impacts));
  return Number(Math.max(Math.min(raw, 500), -500).toFixed(0));
};

export const getVentureTotalLikelihood = (venture, until, impacts) => {
  const magnitude = getVentureTotalMagnitude(venture, until, impacts);
  const score = getVentureTotalScore(venture, until, impacts);
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return 0;
  }
  return Number((score / magnitude * 100).toFixed(0));
};

export const getScoringDates = (venture, period) => {
  const after = period > 0 ? moment().startOf('day').subtract(period, 'days').valueOf() : 0;

  return venture.impacts
    .map(i => i.scoring)
    .flatMap(val => val)
    .filter(s => s.magnitude || s.likelihood)
    .map(s => moment(s.createdAt).endOf('day').valueOf())
    .sort()
    .filter(distinct)
    .filter(val => val > after);
};

export const description = {
  problemImportance: {
    positive: 'What is the perceived problem importance for the stakeholder?',
    negative: 'How relevant is the need you address from a societal perspective',
  },
  stakeholderSituation: {
    positive: 'How underserved are those stakeholders benefiting from your improvements?',
    negative: 'How underserved are the stakeholders exposed to the unintended consequences (negative impact) of your actions?',
  },
  degreeOfChange: {
    positive: 'How much of the problem will be solved an average for each of your beneficiaries, after your intervention?',
    negative: 'How would you rate the situation for the stakeholder after your intervention compared to the status quo?',
  },
  sizeOfStakeholders: {
    positive: 'Number of stakeholders you affect over next 5 years?',
    negative: 'Number of stakeholders you affect over next 5 years?',
  },
  duration: {
    positive: 'How long will the change last and be experienced by the stakeholders?',
    negative: 'How long will the negative change last and be experienced by the stakeholders?',
  },
  contribution: {
    positive: 'How much of the change you describe would probably occur anyways, without your innovation/activities?',
    negative: 'How much of the negative change you describe would probably occur anyways?',
  },
  previousEvidence: {
    positive: 'How likely is it that what you do REALLY leads to the positive change that you describe?',
    negative: 'Overall, how likely would you rate the probability that this negative change occurs up to the level that you indicated in the other rating questions?',
  },
  proximity: {
    positive: 'How much personal experience and exposure is there ABOUT THE PROBLEM that is being solved, from those RESPONSIBLE FOR GENERATING this change?',
  },
  noisiness: {
    positive: 'How well does the indicator measure the change that you described?',
  },
  validation: {
    positive: 'How rigorously do you measure the indicator?',
  },
};

export const getInitialScoringValues = (impact) => {
  const previousScore = impact.scoring?.at(-1) || {};

  return {
    problemImportance: previousScore?.problemImportance || null,
    problemImportanceNegative: previousScore?.problemImportanceNegative || null,
    problemImportanceExplanation: previousScore?.problemImportanceExplanation || '',
    degreeOfChange: previousScore?.degreeOfChange || 1,
    degreeOfChangeExplanation: previousScore?.degreeOfChangeExplanation || '',
    duration: previousScore?.duration || null,
    durationNegative: previousScore?.durationNegative || null,
    durationExplanation: previousScore?.durationExplanation || '',
    contribution: previousScore?.contribution || 100,
    contributionExplanation: previousScore?.contributionExplanation || '',
    previousEvidence: previousScore?.previousEvidence || null,
    previousEvidenceNegative: previousScore?.previousEvidenceNegative || null,
    previousEvidenceExplanation: previousScore?.previousEvidenceExplanation || '',
    proximity: previousScore?.proximity || null,
    proximityExplanation: previousScore?.proximityExplanation || '',
    sizeOfStakeholders: previousScore?.sizeOfStakeholders || null,
    sizeOfStakeholdersNegative: previousScore?.sizeOfStakeholdersNegative || null,
    sizeOfStakeholdersExplanation: previousScore?.sizeOfStakeholdersExplanation || '',
    stakeholderSituation: previousScore?.stakeholderSituation || null,
    stakeholderSituationNegative: previousScore?.stakeholderSituationNegative || null,
    stakeholderSituationExplanation: previousScore?.stakeholderSituationExplanation || '',
    indicatorScores: impact.indicators.map(i => ({
      indicator: i,
      noisiness: previousScore?.indicatorScores.find(s => s.indicator.id === i.id)?.noisiness || null,
      noisinessExplanation: previousScore?.indicatorScores.find(s => s.indicator.id === i.id)?.noisinessExplanation || '',
      validation: previousScore?.indicatorScores.find(s => s.indicator.id === i.id)?.validation || null,
      validationExplanation: previousScore?.indicatorScores.find(s => s.indicator.id === i.id)?.validationExplanation || '',
    })),
    goals: impact.goals || [],
    geography: impact?.geography || [],
    geographyCustom: impact?.geographyCustom || [],
  }
}

export const scoredSdgImpacts = (venture) => {
  return venture.impacts
    .filter(i => !i.draft)
    .filter(i => i.positive)
    .filter(i => i.goals.length > 0)
    .filter(i => i.scoring.at(-1)?.score);
}

export const getVentureGoals = (venture, goals) => {
  const sdgImpacts = scoredSdgImpacts(venture);

  const totalScore = sdgImpacts
    .map(i => i.scoring.at(-1).score)
    .reduce((acc, val) => acc + val, 0);

  let ventureGoals = clone(sdgImpacts
    .flatMap(i => i.goals)
    .map(g => g.goal.name)
    .filter(distinct)
    .map(g => goals.find(goal => goal.name === g)))
    .map(g => ({ ...g, impacts: [] }));

  sdgImpacts.forEach(i => {
    i.goals.forEach(g => {
      const chartGoal = ventureGoals.find(goal => goal.name === g.goal.name);
      const currentRate = chartGoal.rate || 0;
      chartGoal.rate = currentRate + (i.scoring.at(-1).score / totalScore) * g.rate;
      chartGoal.impacts.push(i);
    });
  });

  return ventureGoals.map(g => ({ ...g, rate: g.rate.toFixed(1) })).sort((g1, g2) => g2.rate - g1.rate);
}
