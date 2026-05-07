import { v1 } from './';
import { AUTH_HEADER } from 'shared-components/utils/constants';
import { toast } from 'react-toastify';

const apiService = {
  get: (path, headers, settings) => {
    return makeRequest(path, 'GET', null, headers, settings);
  },
  post: (path, body, headers, settings) => {
    return makeRequest(path, 'POST', body, headers, settings);
  },
  put: (path, body, headers, settings) => {
    return makeRequest(path, 'PUT', body, headers, settings);
  },
  delete: (path, headers, settings) => {
    return makeRequest(path, 'DELETE', null, headers, settings);
  },
};

export default apiService;

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const makeRequest = (path, method = 'GET', body, headers = {}, settings = {}) => {
  if (!path) {
    throw new Error('Path not specified');
  }

  return new Promise((resolve, reject) => {
    v1({
      url: path,
      method: method.toLowerCase(),
      data: body,
      headers: { ...defaultHeaders, ...headers },
      ...settings,
    }).then(
      res => resolve(getData(res)),
      err => {
        showErrorMessage(err);
        return reject(err);
      },
    );
  });
};

const getData = response => {
  if (response.headers[AUTH_HEADER]) {
    v1.setToken(response.headers[AUTH_HEADER]);
  }

  if (!Array.isArray(response.data) && response.data.length === 0) {
    return null;
  }

  return response.data;
};

const showErrorMessage = (error, t = null) => {
  let message;

  if (error?.response?.data instanceof ArrayBuffer && "TextDecoder" in window) {
    const decoder = new TextDecoder("utf-8");
    message = JSON.parse(decoder.decode(error.response.data)).message;
  } else {
    message = error?.response?.data?.message || error.message;
  }

  if (error?.response?.status > 0 && error?.response?.status < 500) {
    toast.error(message);
  }

  return message;
};
