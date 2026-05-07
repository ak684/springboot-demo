import { createSlice } from '@reduxjs/toolkit';
import loadDataExtraReducer from "store/utils/loadDataExtraReducer";
import loadDataInitialState from "store/utils/loadDataInitialState";
import thunks from "./thunks";

const dictionarySlice = createSlice({
  name: 'reportSlice',
  initialState: {
    googleFiles: loadDataInitialState([], false),
    followers: loadDataInitialState([], true),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.createGooglePresentation, 'googleFiles');
    loadDataExtraReducer(builder, thunks.fetchFollowersStatistics, 'followers');
  },
});

export default dictionarySlice.reducer;

