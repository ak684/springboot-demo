import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { portfolioSelectors, portfolioThunks } from 'store/ducks/portfolio';
import { useLocation, useParams } from 'react-router-dom';
import Loader from "shared-components/views/components/Loader";
import { recordPortfolioAccess } from 'utils/portfolioAccess';

const PortfolioContainer = ({ reload = false, forceRefresh = false, children }) => {
  const dispatch = useDispatch();
  const { portfolioId } = useParams();
  const loading = useSelector(portfolioSelectors.currentPortfolioLoading(portfolioId));
  const location = useLocation();
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));

  useEffect(() => {
    if (!portfolio || reload) {
      dispatch(portfolioThunks.fetchCurrentPortfolio(portfolioId));
    }
  }, [dispatch, location.pathname, reload]);

  useEffect(() => {
    localStorage.setItem('latestView', 'portfolio');
    if (portfolioId) {
      recordPortfolioAccess(portfolioId);
    }
  }, [portfolioId]);

  if (!portfolio || (loading && forceRefresh)) {
    return <Loader />;
  } else {
    return children;
  }
};

export default memo(PortfolioContainer);
