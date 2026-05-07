import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';
import loadDataInitialState from 'store/utils/loadDataInitialState';

const portfolioAggregatedSlice = createSlice({
  name: 'portfolioAggregated',
  initialState: {
    aggregatedData: loadDataInitialState([], true),
    aggregatedIndicators: loadDataInitialState([], true),
    columnConfig: loadDataInitialState({}, true),
    visibleColumns: [
      // Organization columns - logo first for visual identification
      'ventureLogo',
      'ventureName',
      'industries',
      'country',
      // Impact Chain columns - Theory of Change prioritized
      'impactName',
      'statusQuo',
      'innovation',
      // Indicator columns - essential info
      'indicatorName',
      'unit',
      // Values columns - current/recent data
      'actual2024',
      'forecast2025'
    ], // Default visible columns following logical flow: Logo → Organization → Impact Chain (TOC) → Indicator → Values
    filters: {
      ventureIds: [],
      search: ''
    }
  },
  reducers: {
    setVisibleColumns: (state, action) => {
      state.visibleColumns = action.payload;
      // Save to localStorage
      localStorage.setItem('portfolioAggregatedColumns', JSON.stringify(action.payload));
    },
    loadVisibleColumnsFromStorage: (state) => {
      const saved = localStorage.getItem('portfolioAggregatedColumns');
      if (saved) {
        try {
          state.visibleColumns = JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to load saved column preferences');
        }
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateAggregatedIndicator: (state, action) => {
      const index = state.aggregatedIndicators.data.findIndex(
        indicator => indicator.id === action.payload.id
      );
      if (index !== -1) {
        state.aggregatedIndicators.data[index] = action.payload;
      } else {
        state.aggregatedIndicators.data.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchAggregatedData, 'aggregatedData');
    loadDataExtraReducer(builder, thunks.fetchAggregatedIndicators, 'aggregatedIndicators');
    loadDataExtraReducer(builder, thunks.fetchColumnConfig, 'columnConfig');
  },
});

export const {
  setVisibleColumns,
  loadVisibleColumnsFromStorage,
  setFilters,
  updateAggregatedIndicator
} = portfolioAggregatedSlice.actions;

export default portfolioAggregatedSlice.reducer;
