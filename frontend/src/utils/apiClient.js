import { handleNetworkError } from './notifications';

const BASE_URL = 'http://localhost:4000/api';

async function request(endpoint, options = {}, retries = 2) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      handleNetworkError(new Error('Session expired'), 'Auth');
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 1000));
      return request(endpoint, options, retries - 1);
    }
    handleNetworkError(error, 'Network request');
    throw error;
  }
}

export const apiClient = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, data, options) => request(url, { ...options, method: 'POST', body: JSON.stringify(data) }),
  patch: (url, data, options) => request(url, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};