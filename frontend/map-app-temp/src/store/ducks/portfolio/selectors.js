const getCurrentPortfolio = (id) => state => {
  if (state.portfolio.current.data?.id === +id) {
    return state.portfolio.current.data;
  }
  return null;
};

const currentPortfolioLoading = (id) => state => {
  return state.portfolio.current.isLoading || state.portfolio.current.data?.id !== +id;
};

export default {
  getCurrentPortfolio,
  currentPortfolioLoading,
};
