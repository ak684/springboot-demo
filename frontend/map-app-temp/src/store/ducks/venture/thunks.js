import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchPublicVentures = createAsyncThunk('venture/fetchPublicList', (days = 7) => {
  return api.get(`/public/ventures?days=${days}`);
});

export default {
  fetchPublicVentures,
};
