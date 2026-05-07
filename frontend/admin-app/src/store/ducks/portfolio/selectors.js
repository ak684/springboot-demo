const getPortfolios = () => state => state.portfolio.list.data;
const portfoliosLoading = () => state => state.portfolio.list.isLoading;
const getDetailedPortfolios = () => state => state.portfolio.detailedList.data;
const detailedPortfoliosLoading = () => state => state.portfolio.detailedList.isLoading;
const getCurrentPortfolio = (id) => state => {
  if (state.portfolio.current.data?.id === +id) {
    return state.portfolio.current.data;
  }
  return null;
};

const currentPortfolioLoading = (id) => state => {
  return state.portfolio.current.isLoading || state.portfolio.current.data?.id !== +id;
};

const getPortfolioVentures = () => state => state.portfolio.ventures.data;
const portfolioVenturesLoading = () => state => state.portfolio.ventures.isLoading;

export default {
  getPortfolios,
  portfoliosLoading,
  getDetailedPortfolios,
  detailedPortfoliosLoading,
  getCurrentPortfolio,
  currentPortfolioLoading,
  getPortfolioVentures,
  portfolioVenturesLoading,
};
