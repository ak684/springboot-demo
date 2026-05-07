import { getBranding } from 'shared-components/utils/branding';

export const getChartTexts = () => {
  const branding = getBranding();
  const companyName = branding.companyName;
  const shortName = branding.companyShortName || companyName;
  const companyHandle = `@${shortName}`;
  return {
    impacts: {
      text: `We focus on impact areas with the highest future impact potential. Below you see our current forecast, using the 5 dimenions of impact and ${companyHandle.toLowerCase()}’s Impact Potential Score.`,
      hashTag: '#RealizingImpactPotential',
    },
    scoring: {
      text: `Using the 5 dimensions of impact and the Impact Potential Score of ${companyHandle}, we project our 5-year impact potential and strategically work to increase our impact poential`,
      hashTag: '#RealizingImpactPotential',
    },
    sdg: {
      text: `We are excited to share how we expect our activities will contribute to achieving the SDGs over the next 5 years. We used ${companyHandle} and the 5 dimensions of impact for our projection.`,
      hashTag: '#ImpactAtTheScore',
    },
    categories: {
      text: `With ${companyHandle}, we project our 5-year impact potential and use the #SDGs classification of the Stockholm Resilience Center to derive our projected triple bottom line impact.`,
      hashTag: '#RealizingImpactPotential',
    },
  };
};
