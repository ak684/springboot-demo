import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataInitialState from 'store/utils/loadDataInitialState';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';

const dictionarySlice = createSlice({
  name: 'dictionarySlice',
  initialState: {
    goals: loadDataInitialState([], true),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchGoals, 'goals');
  },
});

export default dictionarySlice.reducer;

