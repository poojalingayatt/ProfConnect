import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token management
export const getToken = (): string | null => {
    return localStorage.getItem('profconnect_token');
};

export const setToken = (token: string): void => {
    localStorage.setItem('profconnect_token', token);
};

export const removeToken = (): void => {
    localStorage.removeItem('profconnect_token');
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth and redirect to login
            removeToken();
            localStorage.removeItem('profconnect_user');
            localStorage.removeItem('profconnect_user_type');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
