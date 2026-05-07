import { createSlice } from '@reduxjs/toolkit';
import loadDataInitialState from "../../utils/loadDataInitialState";
import loadDataExtraReducer from "../../utils/loadDataExtraReducer";
import thunks from "./thunks";

const pitchSlice = createSlice({
  name: 'pitchSlice',
  initialState: {
    gptText: loadDataInitialState('', false),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.regenerateGptText, 'gptText');
  },
});

export const {} = pitchSlice.actions;
export default pitchSlice.reducer;
