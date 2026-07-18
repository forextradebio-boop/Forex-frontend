import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!config.headers) (config.headers = {} as any);
  if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
  }

  const url = config.url || '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const baseUrl = typeof config.baseURL === 'string' ? config.baseURL : '';
    const baseHasApi = baseUrl.includes('/api');
    if (!baseHasApi && !url.startsWith('/api') && !url.startsWith('/uploads')) {
      config.url = `/api${url.startsWith('/') ? url : `/${url}`}`;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});  



api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('profile');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
