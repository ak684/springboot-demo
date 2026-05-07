import axios from 'axios';
import { API_TOKEN, AUTH_HEADER } from 'shared-components/utils/constants';

export function createApiClient(clientConfig = {}) {
  const client = axios.create({
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...clientConfig,

    validateStatus: status => {
      return status >= 200 && status < 300;
    },
  });

  client.interceptors.request.use(function (config) {
    const savedToken = localStorage.getItem(API_TOKEN);
    const headers = { ...config.headers, [AUTH_HEADER]: savedToken };
    return { ...config, headers };
  }, function (error) {
    return Promise.reject(error);
  });

  client.deleteToken = () => {
    localStorage.removeItem(API_TOKEN);
    client.setToken(null);
  };

  client.setToken = (token) => {
    const headers = client.defaults.headers.common;
    const savedToken = localStorage.getItem(API_TOKEN);
    if (!token && !savedToken) {
      delete headers[AUTH_HEADER];
      return;
    }
    const newToken = token || savedToken;
    headers[AUTH_HEADER] = newToken;
    localStorage.setItem(API_TOKEN, newToken);
  };

  return client;
}
