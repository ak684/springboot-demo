import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from 'react-toastify';
import queryString from 'query-string';

const fetchAggregatedData = createAsyncThunk(
  'portfolioAggregated/fetchData',
  async ({ portfolioId, filters = {} }) => {
    let url = `/portfolios/${portfolioId}/aggregated/data`;
    
    if (filters.ventureIds && filters.ventureIds.length > 0) {
      // Use repeated parameter format: ?ventureIds=1&ventureIds=2
      const queryParams = filters.ventureIds.map(id => `ventureIds=${id}`).join('&');
      url += `?${queryParams}`;
    }
    
    return api.get(url);
  }
);

const fetchAggregatedIndicators = createAsyncThunk(
  'portfolioAggregated/fetchIndicators',
  async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}/aggregated/indicators`);
  }
);

const fetchColumnConfig = createAsyncThunk(
  'portfolioAggregated/fetchColumnConfig',
  async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}/aggregated/columns`);
  }
);

const fetchAvailableIndicators = createAsyncThunk(
  'portfolioAggregated/fetchAvailableIndicators',
  async ({ portfolioId, ventureIds }) => {
    let url = `/portfolios/${portfolioId}/aggregated/available-indicators`;

    if (ventureIds && ventureIds.length > 0) {
      // Use 'index' format which produces: ?ventureIds=1&ventureIds=2&ventureIds=3
      // This is what Spring Boot expects for List<Long> parameters
      const queryParams = ventureIds.map(id => `ventureIds=${id}`).join('&');
      url += `?${queryParams}`;
    }

    console.log('🎯 INDICATOR API CALL:', {
      portfolioId,
      ventureIds,
      fullUrl: url
    });

    return api.get(url);
  }
);

const fetchAvailableDataSources = createAsyncThunk(
  'portfolioAggregated/fetchAvailableDataSources',
  async ({ portfolioId, ventureIds }) => {
    try {
      // Build URL with query params manually since the API service expects a different format
      let url = `/portfolios/${portfolioId}/aggregated/available-data-sources`;
      if (ventureIds && ventureIds.length > 0) {
        const queryParams = ventureIds.map(id => `ventureIds=${id}`).join('&');
        url += `?${queryParams}`;
      }
      
      const response = await api.get(url);
      console.log('Thunk - Raw API response:', response);
      console.log('Thunk - Response type:', typeof response);
      console.log('Thunk - Response keys:', response ? Object.keys(response) : 'null');
      return response; // The api.get already returns response.data
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
      throw error;
    }
  }
);

const fetchMainIndicators = createAsyncThunk(
  'portfolioAggregated/fetchMainIndicators',
  async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}/aggregated/indicators/main`);
  }
);

const createAggregatedIndicator = createAsyncThunk(
  'portfolioAggregated/createIndicator',
  async ({ portfolioId, data }, { dispatch }) => {
    try {
      const response = await api.post(`/portfolios/${portfolioId}/aggregated/indicators`, data);

      // Refresh indicators list
      dispatch(fetchAggregatedIndicators(portfolioId));

      return response.data;
    } catch (error) {
      toast.error('Failed to create aggregated indicator');
      throw error;
    }
  }
);

const fetchAggregatedIndicator = createAsyncThunk(
  'portfolioAggregated/fetchIndicator',
  async ({ portfolioId, indicatorId }) => {
    return api.get(`/portfolios/${portfolioId}/aggregated/indicators/${indicatorId}`);
  }
);

const updateAggregatedIndicator = createAsyncThunk(
  'portfolioAggregated/updateIndicator',
  async ({ portfolioId, indicatorId, data }, { dispatch }) => {
    try {
      const response = await api.put(`/portfolios/${portfolioId}/aggregated/indicators/${indicatorId}`, data);
      
      // Refresh indicators list
      dispatch(fetchAggregatedIndicators(portfolioId));
      
      toast.success('Indicator updated successfully');
      return response;
    } catch (error) {
      toast.error('Failed to update indicator');
      throw error;
    }
  }
);

const deleteAggregatedIndicator = createAsyncThunk(
  'portfolioAggregated/deleteIndicator',
  async ({ portfolioId, indicatorId }, { dispatch }) => {
    try {
      await api.delete(`/portfolios/${portfolioId}/aggregated/indicators/${indicatorId}`);

      // Refresh indicators list
      dispatch(fetchAggregatedIndicators(portfolioId));

      toast.success('Indicator deleted successfully');
      return indicatorId;
    } catch (error) {
      toast.error('Failed to delete indicator');
      throw error;
    }
  }
);

const reorderAggregatedIndicators = createAsyncThunk(
  'portfolioAggregated/reorderIndicators',
  async ({ portfolioId, orderUpdates }, { dispatch }) => {
    try {
      await api.put(`/portfolios/${portfolioId}/aggregated/indicators/reorder`, orderUpdates);

      // Refresh indicators list to get updated order
      dispatch(fetchAggregatedIndicators(portfolioId));

      toast.success('Indicators reordered successfully');
      return orderUpdates;
    } catch (error) {
      toast.error('Failed to reorder indicators');
      throw error;
    }
  }
);

export default {
  fetchAggregatedData,
  fetchAggregatedIndicators,
  fetchColumnConfig,
  fetchAvailableIndicators,
  fetchAvailableDataSources,
  fetchMainIndicators,
  createAggregatedIndicator,
  fetchAggregatedIndicator,
  updateAggregatedIndicator,
  deleteAggregatedIndicator,
  reorderAggregatedIndicators
};
