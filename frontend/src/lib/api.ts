import axios, { AxiosError } from 'axios';
import { token } from '@/lib/token';

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

if (!baseURL) {
  // Fail fast. This should be present in .env as VITE_API_URL.
  throw new Error('Missing VITE_API_URL. Create a frontend .env with VITE_API_URL=http://localhost:3000/api');
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = token.get();
  if (accessToken) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${accessToken}`);
    } else {
      config.headers = {
        ...(config.headers as any),
        Authorization: `Bearer ${accessToken}`,
      } as any;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Global 401 handler: token is invalid/expired.
      token.remove();

      // Avoid redirect loops if we're already on /login.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const isAxiosError = axios.isAxiosError;
