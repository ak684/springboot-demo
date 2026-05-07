import { createApiClient, createLongTimeoutApiClient } from './apiClient';
import api from './apiService';

export const v1 = createApiClient({
  baseURL: '/api/v1',
});

export const v1LongTimeout = createLongTimeoutApiClient({
  baseURL: '/api/v1',
});

export default api;
