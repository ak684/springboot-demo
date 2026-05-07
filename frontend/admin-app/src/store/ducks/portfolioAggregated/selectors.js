import { createSelector } from '@reduxjs/toolkit';

const getPortfolioAggregatedState = (state) => state.portfolioAggregated;

const getAggregatedData = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.aggregatedData.data
);

const getAggregatedIndicators = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.aggregatedIndicators.data
);

const getColumnConfig = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.columnConfig.data
);

const getVisibleColumns = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.visibleColumns
);

const getFilters = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.filters
);

const getLoading = createSelector(
  [getPortfolioAggregatedState],
  (state) => state.aggregatedData.loading || state.columnConfig.loading
);

const getFilteredData = createSelector(
  [getAggregatedData, getFilters],
  (data, filters) => {
    let filtered = data;
    
    // Filter by venture IDs
    if (filters.ventureIds && filters.ventureIds.length > 0) {
      filtered = filtered.filter(item => filters.ventureIds.includes(item.ventureId));
    }
    
    // Filter by search term
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.ventureName?.toLowerCase().includes(searchTerm) ||
        item.impactName?.toLowerCase().includes(searchTerm) ||
        item.indicatorName?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }
);

const getVisibleData = createSelector(
  [getFilteredData, getVisibleColumns, getColumnConfig],
  (data, visibleColumns, columnConfig) => {
    // Return data with only visible columns
    // This is mainly for performance optimization
    return data.map(row => {
      const visibleRow = {};
      visibleColumns.forEach(columnId => {
        // Map year-specific columns from the Maps
        if (columnId.startsWith('actual')) {
          const year = parseInt(columnId.replace('actual', ''));
          visibleRow[columnId] = row.actualValues?.[year];
        } else if (columnId.startsWith('forecast')) {
          const year = parseInt(columnId.replace('forecast', ''));
          visibleRow[columnId] = row.forecastValues?.[year];
        } else {
          visibleRow[columnId] = row[columnId];
        }
      });
      // Always include IDs for navigation/actions
      visibleRow.ventureId = row.ventureId;
      visibleRow.impactId = row.impactId;
      visibleRow.indicatorId = row.indicatorId;
      return visibleRow;
    });
  }
);

const getAllColumns = createSelector(
  [getColumnConfig],
  (columnConfig) => {
    if (!columnConfig || typeof columnConfig !== 'object') return [];
    
    const allColumns = [];
    Object.values(columnConfig).forEach(groupColumns => {
      if (Array.isArray(groupColumns)) {
        allColumns.push(...groupColumns);
      }
    });
    return allColumns;
  }
);

export default {
  getAggregatedData,
  getAggregatedIndicators,
  getColumnConfig,
  getVisibleColumns,
  getFilters,
  getLoading,
  getFilteredData,
  getVisibleData,
  getAllColumns
};
