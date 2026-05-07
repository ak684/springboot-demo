import { createSlice } from '@reduxjs/toolkit';
import loadDataInitialState from "../../utils/loadDataInitialState";
import loadDataExtraReducer from "../../utils/loadDataExtraReducer";
import thunks from "./thunks";

const initialState = {
  note: loadDataInitialState(null),
};

const noteSlice = createSlice({
  name: 'noteSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchNote, 'note');
  }
});

export const {} = noteSlice.actions;
export default noteSlice.reducer;
