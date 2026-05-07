import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const fetchImpactAutofillValues = createAsyncThunk('impact/fetchAutofill', async (_, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.get(`/ventures/${ventureId}/impacts/autofill`);
});

export default {
  fetchImpactAutofillValues
};
