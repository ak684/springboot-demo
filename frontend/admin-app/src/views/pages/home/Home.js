import * as React from 'react';
import { memo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import { userSelectors } from 'store/ducks/user';
import { isDefined } from "shared-components/utils/lo";
import Loader from "shared-components/views/components/Loader";

const Home = () => {
  const dispatch = useDispatch();
  const whiteLabel = window.__BRANDING__?.whiteLabel || {};
  const defaultPostLoginRoute = whiteLabel.defaultPostLoginRoute;
  const companyDashboardRouteTemplate = whiteLabel.companyDashboardRouteTemplate;
  const ventures = useSelector(ventureSelectors.getVentures());
  const portfolios = useSelector(portfolioSelectors.getPortfolios());
  const portfoliosLoading = useSelector(portfolioSelectors.portfoliosLoading());
  const venturesLoading = useSelector(ventureSelectors.venturesLoading());
  const user = useSelector(userSelectors.getCurrentUser());
  const isLoading = venturesLoading || portfoliosLoading;

  // For white-label deep-routing we need portfolios loaded so we can decide
  // between the single-portfolio dashboard shortcut and the picker.
  const needsPortfoliosForRouting = Boolean(companyDashboardRouteTemplate);

  useEffect(() => {
    if (needsPortfoliosForRouting) {
      dispatch(portfolioThunks.fetchPortfolios());
      return;
    }
    if (defaultPostLoginRoute) {
      return;
    }
    dispatch(ventureThunks.fetchVentures());
    dispatch(portfolioThunks.fetchPortfolios());
  }, [needsPortfoliosForRouting, defaultPostLoginRoute, dispatch]);

  const publicProfileOnlyCompanyIds = user?.publicProfileOnlyCompanyIds || [];
  // Wait for the relevant fetches to complete before deciding a user is
  // founder-only — otherwise a hybrid user (portfolio EDIT +
  // PUBLIC_PROFILE_ONLY grant) gets flashed to /manage-public-profile on
  // first render while their portfolios are still loading. On white-label
  // brands (WISTA) the ventures thunk is intentionally never dispatched,
  // so its initial isLoading=true never flips — only wait on portfolios
  // there. On the default brand both fetches fire, so wait on both.
  const loadedEnoughToDecide = needsPortfoliosForRouting
    ? !portfoliosLoading
    : !isLoading;
  const hasOnlyPublicProfileAccess = loadedEnoughToDecide
    && publicProfileOnlyCompanyIds.length > 0
    && ventures.length === 0
    && portfolios.length === 0
    && !user?.superAdmin;

  if (hasOnlyPublicProfileAccess) {
    return <Navigate to='/manage-public-profile' replace />;
  }

  if (needsPortfoliosForRouting) {
    if (portfoliosLoading) {
      return <Loader />;
    }
    if (portfolios.length === 1) {
      const target = companyDashboardRouteTemplate.replace(':portfolioId', String(portfolios[0].id));
      return <Navigate to={target} replace />;
    }
    return <Navigate to={defaultPostLoginRoute || '/portfolios'} replace />;
  }

  if (defaultPostLoginRoute) {
    return <Navigate to={defaultPostLoginRoute} replace />;
  }

  const latestView = localStorage.getItem('latestView');

  if (isLoading) {
    return <Loader />;
  } else if (!isDefined(latestView) || latestView === 'portfolio') {
    if (portfolios.length === 0) {
      return <Navigate to='/portfolios' />;
    } else {
      const portfolio = portfolios.find(v => v.id === Number(localStorage.getItem('currentPortfolio')));

      if (portfolio) {
        return <Navigate to={`/portfolios/${portfolio.id}`} />;
      } else {
        return <Navigate to='/portfolios' />;
      }
    }
  } else {
    if (ventures.length === 0) {
      return <Navigate to='/ventures' />;
    } else {
      const venture = ventures.find(v => v.id === Number(localStorage.getItem('currentVenture')));

      if (venture) {
        return <Navigate to={`/ventures/${venture.id}`} />;
      } else {
        return <Navigate to='/ventures' />;
      }
    }
  }
};

export default memo(Home);
