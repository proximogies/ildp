import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ildp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Only force logout on 401s from auth endpoints, not from every API error
    const url = err.config?.url || '';
    const isAuthError = err.response?.status === 401;
    const isAuthRoute = url.includes('/auth/');
    const message = err.response?.data?.message || '';
    const isTokenError = message.toLowerCase().includes('token') || message.toLowerCase().includes('no token');

    if (isAuthError && (isAuthRoute || isTokenError)) {
      localStorage.removeItem('ildp_token');
      localStorage.removeItem('ildp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
