import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const ventureSlice = createSlice({
  name: 'ventureSlice',
  initialState: {
    list: loadDataInitialState([], true),
    detailedList: loadDataInitialState([], true),
    current: loadDataInitialState(null, true),
    access: loadDataInitialState({}, true),
    publicList: loadDataInitialState([], true),
  },
  reducers: {
    addVenture(state, action) {
      state.list.data.push(action.payload);
    },
    replaceVenture(state, action) {
      const ventureIndex = state.list.data.findIndex(v => v.id === +action.payload.id);
      state.list.data[ventureIndex] = action.payload;
    },
    replaceDetailedVenture(state, action) {
      const ventureIndex = state.detailedList.data.findIndex(v => v.id === +action.payload.id);
      state.detailedList.data[ventureIndex] = action.payload;
    },
    replaceImpact(state, action) {
      const impactIndex = state.current.data.impacts.findIndex(i => i.id === +action.payload.impactId);
      state.current.data.impacts[impactIndex] = action.payload.data;
    },
    replaceIndicator(state, action) {
      const { impactId, indicator } = action.payload;
      const impactIndex = state.current.data.impacts.findIndex(i => i.id === +impactId);
      const indicatorIndex = state.current.data.impacts[impactIndex].indicators.findIndex(i => i.id === indicator.id);
      state.current.data.impacts[impactIndex].indicators[indicatorIndex] = indicator;
    },
    updateIndicator(state, action) {
      const { impactId, indicator } = action.payload;
      const impactIndex = state.current.data.impacts.findIndex(i => i.id === +impactId);
      const indicatorIndex = state.current.data.impacts[impactIndex].indicators.findIndex(i => i.id === indicator.id)
      const stateIndicator = state.current.data.impacts[impactIndex].indicators[indicatorIndex];
      stateIndicator.name = indicator.name;
      stateIndicator.year = indicator.year;
    },
    updateImpactOrder(state, action) {
      const { from, to } = action.payload;
      const impact = state.current.data.impacts.splice(from, 1)[0];
      state.current.data.impacts.splice(to, 0, impact);
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
    insertAcceleration(state, action) {
      state.current.data.acceleration.push(action.payload);
    },
    replaceAcceleration(state, action) {
      const index = state.current.data.acceleration.findIndex(a => a.id === action.payload.id);
      state.current.data.acceleration[index] = action.payload;
    },
    deleteAcceleration(state, action) {
      const index = state.current.data.acceleration.findIndex(a => a.id === action.payload.id);
      state.current.data.acceleration.splice(index, 1);
    },
    insertFundingRound(state, action) {
      state.current.data.funding.push(action.payload);
    },
    replaceFundingRound(state, action) {
      const index = state.current.data.funding.findIndex(f => f.id === action.payload.id);
      state.current.data.funding[index] = action.payload;
    },
    deleteFundingRound(state, action) {
      const index = state.current.data.funding.findIndex(f => f.id === action.payload.id);
      state.current.data.funding.splice(index, 1);
    },
    insertAward(state, action) {
      state.current.data.awards.push(action.payload);
    },
    replaceAward(state, action) {
      const index = state.current.data.awards.findIndex(a => a.id === action.payload.id);
      state.current.data.awards[index] = action.payload;
    },
    deleteAward(state, action) {
      const index = state.current.data.awards.findIndex(a => a.id === action.payload.id);
      state.current.data.awards.splice(index, 1);
    },
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchVentures, 'list');
    loadDataExtraReducer(builder, thunks.fetchVenturesWithDetails, 'detailedList');
    loadDataExtraReducer(builder, thunks.fetchCurrentVenture, 'current');
    loadDataExtraReducer(builder, thunks.fetchVenturesAccess, 'access');
    loadDataExtraReducer(builder, thunks.fetchPublicVentures, 'publicList');
  },
});

export const {
  addVenture,
  replaceVenture,
  replaceDetailedVenture,
  replaceImpact,
  replaceIndicator,
  updateIndicator,
  updateImpactOrder,
  insertTeamMember,
  replaceTeamMember,
  deleteTeamMember,
  insertAcceleration,
  replaceAcceleration,
  deleteAcceleration,
  insertFundingRound,
  replaceFundingRound,
  deleteFundingRound,
  insertAward,
  replaceAward,
  deleteAward,
} = ventureSlice.actions;
export default ventureSlice.reducer;
