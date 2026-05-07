import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchCurrentPortfolio = createAsyncThunk('portfolio/fetchCurrent', async (id) => {
  return api.get(`/portfolios/${id}`);
});

export default {
  fetchCurrentPortfolio
};
