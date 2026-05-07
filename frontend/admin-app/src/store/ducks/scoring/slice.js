import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const scoringSlice = createSlice({
  name: 'scoringSlice',
  initialState: {
    current: loadDataInitialState({}, false),
  },
  reducers: {
    replaceImpact(state, action) {
      const impactIndex = state.current.data.impacts.findIndex(v => v.id === action.payload.impactId);
      state.current.data.impacts[impactIndex] = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchScoring, 'current');
  },
});

export const { replaceImpact, updateImpactOrder } = scoringSlice.actions;
export default scoringSlice.reducer;
