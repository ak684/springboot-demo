import PitchIntroSlide from "../slides/PitchIntroSlide";
import PitchMissionSlide from "../slides/PitchMissionSlide";
import PitchDescriptionSlide from "../slides/PitchDescriptionSlide";
import PitchImpactIntroSlide from "../slides/PitchImpactIntroSlide";
import PitchImpactDescriptionSlide from "../slides/PitchImpactDescriptionSlide";
import PitchImpactDetailsSlide from "../slides/PitchImpactDetailsSlide";
import PitchSdgSlide from "../slides/PitchSdgSlide";
import PitchSdgImpactSlide from "../slides/PitchSdgImpactSlide";
import PitchIntroSlideSettings from "../slides/settings/PitchIntroSlideSettings";
import PitchMissionSlideSettings from "../slides/settings/PitchMissionSlideSettings";
import PitchDescriptionSlideSettings from "../slides/settings/PitchDescriptionSlideSettings";
import PitchImpactIntroSlideSettings from "../slides/settings/PitchImpactIntroSlideSettings";
import PitchImpactDescriptionSlideSettings from "../slides/settings/PitchImpactDescriptionSlideSettings";

export const getSteps = (venture) => () => {
  if (!venture) {
    return [];
  }

  const result = [
    {
      section: 'overview',
      component: PitchIntroSlide,
      name: 'intro',
      title: 'Venture name',
      settings: PitchIntroSlideSettings
    },
    {
      section: 'overview',
      component: PitchMissionSlide,
      name: 'mission',
      title: 'Our mission',
      settings: PitchMissionSlideSettings
    },
    {
      section: 'overview',
      component: PitchDescriptionSlide,
      name: 'description',
      title: 'About us',
      settings: PitchDescriptionSlideSettings
    },
    { section: 'overview', component: PitchSdgSlide, name: 'sdg', title: 'Our SDGs' },
    { section: 'overview', component: PitchSdgImpactSlide, name: 'sdgImpact', title: 'Key impact areas' },
  ];

  venture.impacts.forEach((impact, index) => {
    result.push({
      section: 'impact',
      component: PitchImpactIntroSlide,
      name: `impacts[${impact.id}].intro`,
      title: `Impact area ${index + 1}`,
      props: { impact, index },
      settings: PitchImpactIntroSlideSettings,
    });
    result.push({
      section: 'impact',
      component: PitchImpactDescriptionSlide,
      name: `impacts[${impact.id}].about`,
      title: 'About',
      props: { impact, index },
      settings: PitchImpactDescriptionSlideSettings,
    });
    result.push({
      section: 'impact',
      component: PitchImpactDetailsSlide,
      name: `impacts[${impact.id}].details`,
      title: 'Details',
      props: { impact, index },
    });
  })

  return result;
};
