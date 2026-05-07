import PublicProfileImpactDetailsIndicatorCard from "../components/PublicProfileImpactDetailsIndicatorCard";
import PublicProfileImpactDetailsText from "../components/PublicProfileImpactDetailsText";

export const getSteps = (impact) => () => {
  const result = [
    {
      name: 'statusQuo',
      component: PublicProfileImpactDetailsText,
      props: { title: 'Status Quo', text: impact.statusQuo, }
    },
    {
      name: 'innovation',
      component: PublicProfileImpactDetailsText,
      props: { title: 'Innovation', text: impact.innovation, }
    },
    {
      name: 'stakeholders',
      component: PublicProfileImpactDetailsText,
      props: { title: 'Stakeholders', text: impact.stakeholders, }
    },
    {
      name: 'change',
      component: PublicProfileImpactDetailsText,
      props: { title: 'Change', text: impact.change, }
    }
  ];

  result.push(...impact.indicators.map((i, index) => ({
    name: `indicators[${index}]`,
    component: PublicProfileImpactDetailsIndicatorCard,
    props: { indicator: i }
  })));

  return result;
};
