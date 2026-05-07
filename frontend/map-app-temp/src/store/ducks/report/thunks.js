import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchFollowersStatistics = createAsyncThunk('report/getFollowers', (days, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.get(`/followers/${ventureId}?days=${days}`);
});

export default {
  fetchFollowersStatistics,
};

