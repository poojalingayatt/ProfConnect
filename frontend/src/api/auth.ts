import apiClient, { setToken } from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'faculty';
}

export interface AuthResponse {
    success: boolean;
    data: {
        accessToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            department?: string;
            avatarUrl?: string;
        };
    };
}

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', data);
        if (response.data.success && response.data.data.accessToken) {
            setToken(response.data.data.accessToken);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        if (response.data.success && response.data.data.accessToken) {
            setToken(response.data.data.accessToken);
        }
        return response.data;
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};
