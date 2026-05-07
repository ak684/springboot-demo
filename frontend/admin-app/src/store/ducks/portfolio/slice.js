import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const portfolioSlice = createSlice({
  name: 'portfolioSlice',
  initialState: {
    list: loadDataInitialState([], true),
    detailedList: loadDataInitialState([], true),
    current: loadDataInitialState(null, true),
    ventures: loadDataInitialState([], true),
  },
  reducers: {
    addPortfolio(state, action) {
      state.list.data.push(action.payload);
    },
    replacePortfolio(state, action) {
      const portfolioIndex = state.list.data.findIndex(v => v.id === +action.payload.id);
      state.list.data[portfolioIndex] = action.payload;
    },
    replaceVenture(state, action) {
      const ventureIndex = state.ventures.data.map(d => d.venture).findIndex(v => v.id === +action.payload.id);
      state.ventures.data[ventureIndex].venture = action.payload;
    },
    insertTeamMember(state, action) {
      state.current.data.team.push(action.payload);
    },
    replaceTeamMember(state, action) {
      const index = state.current.data.team.findIndex(m => m.id === action.payload.id);
      state.current.data.team[index] = action.payload;
    },
    deleteTeamMember(state, action) {
      const index = state.current.data.team.findIndex(m => m.id === action.payload.id);
      state.current.data.team.splice(index, 1);
    },
    toggleVentureHidden(state, action) {
      const venture = state.ventures.data.find(v => v.venture.id === +action.payload);
      venture.hidden = !venture.hidden;
    },
    toggleVenturePublicHidden(state, action) {
      const venture = state.ventures.data.find(v => v.venture.id === +action.payload);
      venture.publicHidden = !venture.publicHidden;
    },
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchPortfolios, 'list');
    loadDataExtraReducer(builder, thunks.fetchPortfoliosWithDetails, 'detailedList');
    loadDataExtraReducer(builder, thunks.fetchCurrentPortfolio, 'current');
    loadDataExtraReducer(builder, thunks.fetchPortfolioVentures, 'ventures');
  },
});

export const {
  addPortfolio,
  replacePortfolio,
  insertTeamMember,
  replaceTeamMember,
  deleteTeamMember,
  replaceVenture,
  toggleVentureHidden,
  toggleVenturePublicHidden,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
