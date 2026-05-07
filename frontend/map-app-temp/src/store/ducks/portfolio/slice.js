import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const portfolioSlice = createSlice({
  name: 'portfolioSlice',
  initialState: {
    current: loadDataInitialState(null, true),
  },
  reducers: {
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchCurrentPortfolio, 'current');
  },
});

export const {} = portfolioSlice.actions;

export default portfolioSlice.reducer;
