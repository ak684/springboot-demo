import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from 'react-toastify';
import { ventureThunks } from "../venture";
import { portfolioThunks } from "../portfolio";

const requestPitchAccess = createAsyncThunk('public/requestPitch', async ({ data, venture }) => {
  return api.post(`/public/pitch-access/ventures/${venture.id}`, data)
    .then(() => {
      toast.success('Your request has been sent to the venture owner');
    });
});

const fetchIndicatorViews = createAsyncThunk('public/fetchIndicatorViews', async () => {
  return api.get(`/dictionaries/indicator-public-view`);
});

const fetchPublicVenture = createAsyncThunk('public/fetchVenture', async (id) => {
  return api.get(`/public/ventures/${id}`);
});

const updateVenturePublicSettings = createAsyncThunk('public/updateVentureSettings', async (venture, { dispatch }) => {
  const body = { ...venture, country: undefined, industries: undefined };

  return api.put(`/public/ventures/${venture.id}/settings`, body)
    .then((res) => {
      dispatch(ventureThunks.fetchCurrentVenture(venture.id));
      dispatch(fetchPublicVenture(venture.id));
      return res;
    });
});

const updateVenturePublicVisibility = createAsyncThunk('pitch/updateVentureVisibility', async ({ venture, share }, { dispatch }) => {
  return api.put(`/public/ventures/${venture.id}/share`, { share })
    .then((res) => {
      dispatch(ventureThunks.fetchCurrentVenture(venture.id));
      return res;
    });
});

const fetchPublicPortfolio = createAsyncThunk('public/fetchPortfolio', async (uuid) => {
  return api.get(`/public/portfolios/${uuid}`);
});

const fetchPortfolioVentures = createAsyncThunk('public/fetchPortfolioVentures', async ({ id, period }) => {
  return api.get(`/public/portfolios/${id}/ventures?days=${period}`);
});

const fetchPortfolioVenturesAll = createAsyncThunk('public/fetchPortfolioVenturesAll', async (id) => {
  return api.get(`/public/portfolios/${id}/ventures/all`);
});

const updatePortfolioPublicSettings = createAsyncThunk('public/updatePortfolioSettings', async (portfolio, { dispatch }) => {
  const body = { ...portfolio, country: undefined };

  return api.put(`/public/portfolios/${portfolio.id}/settings`, body)
    .then((res) => {
      dispatch(portfolioThunks.fetchCurrentPortfolio(portfolio.id));
      dispatch(fetchPublicPortfolio(portfolio.id));
      return res;
    });
});

const updatePortfolioPublicVisibility = createAsyncThunk('pitch/updatePortfolioVisibility', async ({ portfolio, share }, { dispatch }) => {
  return api.put(`/public/portfolios/${portfolio.id}/share`, { share })
    .then((res) => {
      dispatch(portfolioThunks.fetchCurrentPortfolio(portfolio.id));
      return res;
    });
});


export default {
  requestPitchAccess,
  fetchIndicatorViews,
  fetchPublicVenture,
  updateVenturePublicSettings,
  updateVenturePublicVisibility,
  fetchPublicPortfolio,
  fetchPortfolioVentures,
  fetchPortfolioVenturesAll,
  updatePortfolioPublicSettings,
  updatePortfolioPublicVisibility,
};
