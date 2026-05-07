import ImpactTypeSelect from '../components/ImpactTypeSelect';
import ImpactAutocomplete from '../components/ImpactAutocomplete';
import ImpactStakeholderInput from '../components/ImpactStakeholderInput';
import ImpactIndicatorInput from '../components/ImpactIndicatorInput';
import ImpactNameInput from '../components/ImpactNameInput';
import FinishIndicatorInput from '../components/FinishIndicatorInput';
import ImpactSpecificStakeholderInput from '../components/ImpactSpecificStakeholderInput';
import ImpactIndicatorYearInput from '../components/ImpactIndicatorYearInput';
import { impactTooltips } from "shared-components/utils/impact";

export const getSteps = (indicators, specificStakeholder, positive) => () => {
  const result = [
    { component: ImpactTypeSelect },
    {
      name: 'statusQuo',
      component: ImpactAutocomplete,
      props: {
        name: 'statusQuo',
        title: 'Status quo solution',
        description: 'What would people use, if they were not to use your innovation?',
        tooltip: impactTooltips.statusQuo(),
      }
    },
    {
      name: 'innovation',
      component: ImpactAutocomplete,
      props: {
        name: 'innovation',
        title: 'What you do differently?',
        description: 'What operations, services, elements do you change, compared to that status quo?',
        tooltip: impactTooltips.innovation()
      }
    },
    { name: 'stakeholders', component: ImpactStakeholderInput },
    {
      name: 'change',
      component: ImpactAutocomplete,
      props: {
        name: 'change',
        title: 'Change for stakeholders?',
        description:
          positive ?
            'What do your actions improve for the stakeholders?' :
            'What negative impacts do your stakeholders experience?',
        tooltip: impactTooltips.change(positive)
      }
    },
    {
      name: 'outputUnits',
      component: ImpactAutocomplete,
      props: {
        name: 'outputUnits',
        title: 'Products/services/activities?',
        description: positive ?
          'What products units/services do you deliver, that will create your positive change?' :
          'What products units/services do you deliver, that will create the negative impact?',
        tooltip: impactTooltips.outputUnits()
      }
    },
  ];

  if (specificStakeholder) {
    result.splice(4, 0, { name: 'stakeholders', component: ImpactSpecificStakeholderInput });
  }

  indicators.forEach((indicator, index) => {
    result.push({ name: `indicators[${index}].name`, component: ImpactIndicatorInput, props: { indicator, index } });

    if (index > 0 || indicator.name) {
      result.push({
        name: `indicators[${index}].year`,
        component: ImpactIndicatorYearInput,
        props: { indicator, index }
      });
    }
  });

  if (indicators[0]?.name) {
    result.push({ component: FinishIndicatorInput });
  }

  result.push({ component: ImpactNameInput });

  return result;
};
