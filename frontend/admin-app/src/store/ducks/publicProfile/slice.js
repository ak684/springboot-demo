import { createSlice } from '@reduxjs/toolkit';
import loadDataInitialState from "../../utils/loadDataInitialState";
import loadDataExtraReducer from "../../utils/loadDataExtraReducer";
import thunks from "./thunks";

const publicProfileSlice = createSlice({
  name: 'publicProfileSlice',
  initialState: {
    indicatorViews: loadDataInitialState([]),
    venture: loadDataInitialState(null, true),
    portfolio: loadDataInitialState(null, true),
    portfolioVentures: loadDataInitialState([], true),
    portfolioVenturesAll: loadDataInitialState([], true),
  },
  reducers: {},
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchIndicatorViews, 'indicatorViews');
    loadDataExtraReducer(builder, thunks.fetchPublicVenture, 'venture');
    loadDataExtraReducer(builder, thunks.fetchPublicPortfolio, 'portfolio');
    loadDataExtraReducer(builder, thunks.fetchPortfolioVentures, 'portfolioVentures');
    loadDataExtraReducer(builder, thunks.fetchPortfolioVenturesAll, 'portfolioVenturesAll');
  }
});

export const {  } = publicProfileSlice.actions;
export default publicProfileSlice.reducer;
