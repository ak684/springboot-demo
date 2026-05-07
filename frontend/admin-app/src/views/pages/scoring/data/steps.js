import ScoringSelect from '../components/ScoringSelect';
import ScoringDegreeOfChange from '../components/ScoringDegreeOfChange';
import ScoringSdgSelect from '../components/ScoringSdgSelect';
import ScoringSdgMeasure from '../components/ScoringSdgMeasure';
import ScoringContribution from '../components/ScoringContribution';
import { description } from "shared-components/utils/scoring";
import { GLOBAL_COMMUNITY_INPUT } from "shared-components/utils/constants";
import ScoringStakeholderGeographyInput from '../components/ScoringStakeholderGeographyInput';

export const getSteps = (impact, questions, goals) => () => {
  const indicators = impact?.indicators;

  const result = [{ name: 'sdg', component: ScoringSdgSelect }];

  if (goals.length > 0) {
    result.push({ name: 'sdg', component: ScoringSdgMeasure });
  }

  result.push(
    {
      name: 'problemImportance',
      component: ScoringSelect,
      highlight: ['stakeholders', 'change'],
      props: {
        name: impact?.positive ? 'problemImportance' : 'problemImportanceNegative',
        fieldName: 'problemImportance',
        title: 'Problem importance',
        description: impact?.positive ? description.problemImportance.positive : description.problemImportance.negative,
        items: impact?.positive ? questions.problemImportance : questions.problemImportanceNegative,
      }
    },
    {
      name: 'stakeholderSituation',
      component: ScoringSelect,
      highlight: ['stakeholders'],
      props: {
        name: impact?.positive ? 'stakeholderSituation' : 'stakeholderSituationNegative',
        fieldName: 'stakeholderSituation',
        title: 'Stakeholder situation',
        description: impact?.positive ? description.stakeholderSituation.positive : description.stakeholderSituation.negative,
        items: impact?.positive ? questions.stakeholderSituation : questions.stakeholderSituationNegative,
      }
    }
  );

  if (impact?.stakeholders !== GLOBAL_COMMUNITY_INPUT) {
    result.push({
      name: 'geography',
      component: ScoringStakeholderGeographyInput,
      highlight: ['stakeholders'],
      props: { impact }
    });
  }

  result.push(
    {
      name: 'degreeOfChange',
      component: ScoringDegreeOfChange,
      highlight: ['change'],
      props: {
        name: 'degreeOfChange',
        title: 'Degree of change',
        description: impact?.positive ? description.degreeOfChange.positive : description.degreeOfChange.negative,
        items: impact?.positive ? questions.degreeOfChange : questions.degreeOfChangeNegative,
      }
    },
    {
      name: 'sizeOfStakeholders',
      component: ScoringSelect,
      highlight: ['stakeholders'],
      props: {
        name: impact?.positive ? 'sizeOfStakeholders' : 'sizeOfStakeholdersNegative',
        fieldName: 'sizeOfStakeholders',
        title: 'Size of stakeholder group',
        description: impact?.positive ? description.sizeOfStakeholders.positive : description.sizeOfStakeholders.negative,
        items: impact?.positive ? questions.sizeOfStakeholders : questions.sizeOfStakeholdersNegative,
      }
    },
    {
      name: 'duration',
      component: ScoringSelect,
      highlight: ['change'],
      props: {
        name: impact?.positive ? 'duration' : 'durationNegative',
        fieldName: 'duration',
        title: 'Duration',
        description: impact?.positive ? description.duration.positive : description.duration.negative,
        items: impact?.positive ? questions.duration : questions.durationNegative,
      }
    },
    {
      name: 'contribution',
      component: ScoringContribution,
      highlight: ['change'],
      props: {
        name: 'contribution',
        title: 'Enterprise contribution',
        description: impact?.positive ? description.contribution.positive : description.contribution.negative,
        items: impact?.positive ? questions.contribution : questions.contributionNegative,
      },
    },
    {
      name: 'previousEvidence',
      component: ScoringSelect,
      highlight: ['change'],
      props: {
        name: impact?.positive ? 'previousEvidence' : 'previousEvidenceNegative',
        fieldName: 'previousEvidence',
        title: 'Previous evidence',
        description: impact?.positive ? description.previousEvidence.positive : description.previousEvidence.negative,
        items: impact?.positive ? questions.previousEvidence : questions.previousEvidenceNegative,
        last: !impact?.positive
      },
    },
  );

  if (impact?.positive) {
    result.push({
      name: 'proximity',
      component: ScoringSelect,
      highlight: ['change'],
      props: {
        name: 'proximity',
        fieldName: 'proximity',
        title: 'Proximity',
        description: description.proximity.positive,
        items: questions.proximity,
        last: impact?.indicators.length === 0,
      }
    });

    indicators.forEach((indicator, index) => {
      result.push({
        name: `noisiness[${index}]`,
        component: ScoringSelect,
        highlight: [`noisiness[${index}]`],
        props: {
          name: `indicatorScores[${index}].noisiness`,
          title: 'Indicator noisiness',
          description: description.noisiness.positive,
          items: questions.noisiness,
          indicator,
          fieldName: 'noisiness',
        }
      });

      result.push({
        name: `validation[${index}]`,
        component: ScoringSelect,
        highlight: [`validation[${index}]`],
        props: {
          name: `indicatorScores[${index}].validation`,
          title: 'Validation',
          description: description.validation.positive,
          items: questions.validation,
          indicator,
          last: index === impact?.indicators.length - 1,
          fieldName: 'validation',
        },
      });
    });
  }

  return result;
};
