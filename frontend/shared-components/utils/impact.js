import { IMPACT_FILTER, IMPACT_SORT } from './constants';

export const filteredImpacts = (impacts, filter) => (impacts || []).filter(impact => {
  return ((impact.positive && filter.includes(IMPACT_FILTER.POSITIVE)) || (!impact.positive && filter.includes(IMPACT_FILTER.NEGATIVE))) &&
    ((impact.draft && filter.includes(IMPACT_FILTER.DRAFT)) || (!impact.draft && filter.includes(IMPACT_FILTER.NOT_DRAFT)));
});

export const sortedImpacts = (impacts, sortBy) => impacts.sort((i1, i2) => {
  // This logic is duplicated on backend in generateImpactsExport
  if (sortBy === IMPACT_SORT.CUSTOM) {
    return impacts;
  }

  if (i1.draft !== i2.draft) {
    return i1.draft - i2.draft;
  }

  if (i1.positive !== i2.positive) {
    return i2.positive - i1.positive;
  }

  const i1Val = i1.scoring.at(-1)?.[sortBy];
  const i2Val = i2.scoring.at(-1)?.[sortBy];

  if (!i1Val && !i2Val) {
    return new Date(i1.createdAt).getTime() - new Date(i2.createdAt).getTime();
  } else {
    return (i2Val || 0) - (i1Val || 0);
  }
});

export const impactTooltips = {
  statusQuo: () => 'What is the current solution, that your future customer would take if you did not exist? What does your organization replace? If you create a new market segment, please indicate what current solution / value proposition comes closest to your solution.',
  innovation: () => 'We want to measure the impact of your innovation only. This means you measure only improvements compared to the status quo solution. If you claim to have impact, you need to do something differently , in order the generate impact. Note we are interested in innovations that are likely to have a sustainability impact.',
  change: (positive) => positive
    ? 'Make sure that there is a direct link between your actions/innovations and the change you describe here. Also, make sure the change is relevant from a social, environmental or sustainable economic development perspective.'
    : 'Make sure that there is a direct link between your actions/innovations and the change you describe here. Also, make sure the negative impact is relevant from a social, environmental or sustainable economic development perspective.',
  outputUnits: () => 'Examples could be: Software licenses sold, meals delivered, coaching sessions provided, products sold etc.'
}

export const impactFieldNames = {
  statusQuo: 'Status quo',
  innovation: 'Our solution',
  stakeholders: 'Stakeholders',
  change: 'We improve / worsen',
  outputUnits: 'Output units',
}

export const getImpactIndex = (impact, impacts) => impacts.filter(i => i.positive === impact.positive).indexOf(impact) + 1;
