import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchGoals = createAsyncThunk('dictionary/fetchGoals', async () => {
  return api.get('/dictionaries/goals');
});

export default {
  fetchGoals,
};

