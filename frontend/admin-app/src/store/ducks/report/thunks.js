import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const createGooglePresentation = createAsyncThunk('report/google', (_, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.get(`/reports/ventures/${ventureId}/google`);
});

const fetchFollowersStatistics = createAsyncThunk('report/getFollowers', (days, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.get(`/followers/${ventureId}?days=${days}`);
});

export default {
  createGooglePresentation,
  fetchFollowersStatistics,
};

