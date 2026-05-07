const getIndicatorViews = () => state => state.publicProfile.indicatorViews.data;

const getPublicVenture = (id) => state => {
  if (state.publicProfile.venture.data?.id === +id) {
    return state.publicProfile.venture.data;
  }
  return null;
};

const publicVentureLoading = (id) => state => {
  return state.publicProfile.venture.isLoading || state.publicProfile.venture.data?.id !== +id;
};

const getPublicPortfolio = (id) => state => {
  if (state.publicProfile.portfolio.data?.id === +id) {
    return state.publicProfile.portfolio.data;
  }
  return null;
};

const publicPortfolioLoading = (id) => state => {
  return state.publicProfile.portfolio.isLoading || state.publicProfile.portfolio.data?.id !== +id;
};

const getPortfolioVentures = () => state => {
  return state.publicProfile.portfolioVentures.data;
};

const portfolioVenturesLoading = () => state => {
  return state.publicProfile.portfolioVentures.isLoading;
};

const getPortfolioVenturesAll = () => state => {
  return state.publicProfile.portfolioVenturesAll.data;
};



export default {
  getIndicatorViews,
  getPublicVenture,
  publicVentureLoading,
  getPublicPortfolio,
  publicPortfolioLoading,
  getPortfolioVentures,
  portfolioVenturesLoading,
  getPortfolioVenturesAll,
};
