import axios, { AxiosError } from 'axios';
import { token } from '@/lib/token';

const baseURL = import.meta.env.VITE_API_URL as string | undefined;
const apiBase = import.meta.env.VITE_API_BASE as string | undefined;

if (!baseURL || !apiBase) {
  // Fail fast. Both values must be provided for API and sockets.
  throw new Error('Missing VITE_API_URL or VITE_API_BASE');
}

export const API_BASE = apiBase;

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
