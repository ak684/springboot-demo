import { IMPACT_SORT } from "shared-components/utils/constants";

const getImpactFilter = () => state => state.app.impactFilter;

const getImpactSort = () => state => {
  // we need to subscribe to store updates to re-render when sort is changed
  const initialSort = state.app.impactSort;
  const ventureId = state.venture.current?.data?.id;

  if (ventureId) {
    const sort = localStorage.getItem(`impactSort_${ventureId}`);
    if (sort && Object.values(IMPACT_SORT)) {
      return sort;
    }
  }

  return IMPACT_SORT.BY_SCORE;
}

const getPublicSort = () => state => state.app.publicSort;

const getPublicPeriod = () => state => state.app.publicPeriod;

const getOnboarding = () => state => state.app.onboarding;

export default {
  getImpactFilter,
  getImpactSort,
  getPublicSort,
  getPublicPeriod,
  getOnboarding,
};
