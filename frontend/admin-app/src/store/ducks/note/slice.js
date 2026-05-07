import { createSlice } from '@reduxjs/toolkit';
import loadDataInitialState from "../../utils/loadDataInitialState";
import loadDataExtraReducer from "../../utils/loadDataExtraReducer";
import thunks from "./thunks";

const initialState = {
  note: loadDataInitialState(null),
  details: {
    screen: null,
    impact: null,
    indicator: null,
  }
};

const noteSlice = createSlice({
  name: 'noteSlice',
  initialState,
  reducers: {
    openDrawer(state, action) {
      state.details = { ...action.payload };
    },
    closeDrawer: (state) => {
      state.details = initialState.details;
    },
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchNote, 'note');
  }
});

export const { openDrawer, closeDrawer } = noteSlice.actions;
export default noteSlice.reducer;
