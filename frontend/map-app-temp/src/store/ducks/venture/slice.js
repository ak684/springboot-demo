import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const ventureSlice = createSlice({
  name: 'ventureSlice',
  initialState: {
    current: loadDataInitialState(null, true),
    publicList: loadDataInitialState([], true),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchPublicVentures, 'publicList');
  },
});

export const {} = ventureSlice.actions;
export default ventureSlice.reducer;
