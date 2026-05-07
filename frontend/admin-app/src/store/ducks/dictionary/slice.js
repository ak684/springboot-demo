import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataInitialState from 'store/utils/loadDataInitialState';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';

const dictionarySlice = createSlice({
  name: 'dictionarySlice',
  initialState: {
    goals: loadDataInitialState([], true),
    scoring: loadDataInitialState({}, true),
    geography: loadDataInitialState([], true),
    industries: loadDataInitialState([], true),
    units: loadDataInitialState([], true),
    fundingRoundTypes: loadDataInitialState([], true),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchGoals, 'goals');
    loadDataExtraReducer(builder, thunks.fetchScoringQuestions, 'scoring');
    loadDataExtraReducer(builder, thunks.fetchGeography, 'geography');
    loadDataExtraReducer(builder, thunks.fetchIndustries, 'industries');
    loadDataExtraReducer(builder, thunks.fetchUnits, 'units');
    loadDataExtraReducer(builder, thunks.fetchFundingRoundTypes, 'fundingRoundTypes');
  },
});

export default dictionarySlice.reducer;

