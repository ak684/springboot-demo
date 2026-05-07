import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const impactSlice = createSlice({
  name: 'impactSlice',
  initialState: {
    autofill: loadDataInitialState({
      statusQuo: [],
      innovation: [],
      stakeholders: [],
      change: [],
      outputUnits: [],
    }),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchImpactAutofillValues, 'autofill');
  },
});

export const {} = impactSlice.actions;
export default impactSlice.reducer;
