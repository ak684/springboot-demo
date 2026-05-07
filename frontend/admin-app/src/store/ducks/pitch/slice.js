import { createSlice } from '@reduxjs/toolkit';
import loadDataInitialState from "../../utils/loadDataInitialState";
import loadDataExtraReducer from "../../utils/loadDataExtraReducer";
import thunks from "./thunks";

const pitchSlice = createSlice({
  name: 'pitchSlice',
  initialState: {
    venture: loadDataInitialState(null, true),
    gptText: loadDataInitialState('', false),
    indicatorViews: loadDataInitialState([]),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchPitchVenture, 'venture');
    loadDataExtraReducer(builder, thunks.fetchPitchVentureAuth, 'venture');
    loadDataExtraReducer(builder, thunks.regenerateGptText, 'gptText');
    loadDataExtraReducer(builder, thunks.fetchIndicatorViews, 'indicatorViews');
  },
});

export const {} = pitchSlice.actions;
export default pitchSlice.reducer;
