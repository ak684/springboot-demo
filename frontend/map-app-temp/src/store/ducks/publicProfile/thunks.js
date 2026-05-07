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

const fetchPublicVenture = createAsyncThunk('public/fetchVenture', async (uuid) => {
  return api.get(`/public/ventures/${uuid}`);
});

const fetchPublicPortfolio = createAsyncThunk('public/fetchPortfolio', async (uuid) => {
  return api.get(`/public/portfolios/${uuid}`);
});

const fetchPortfolioVentures = createAsyncThunk('public/fetchPortfolioVentures', async (id) => {
  return api.get(`/public/portfolios/${id}/ventures`);
});

const fetchPortfolioVenturesAll = createAsyncThunk('public/fetchPortfolioVenturesAll', async (id) => {
  return api.get(`/public/portfolios/${id}/ventures/all`);
});

export default {
  requestPitchAccess,
  fetchIndicatorViews,
  fetchPublicVenture,
  fetchPublicPortfolio,
  fetchPortfolioVentures,
  fetchPortfolioVenturesAll,
};
