import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const certificationSlice = createSlice({
  name: 'certificationSlice',
  initialState: {
    criteria: loadDataInitialState({}),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchCertificationCriteria, 'criteria');
  },
});

export const {} = certificationSlice.actions;
export default certificationSlice.reducer;
