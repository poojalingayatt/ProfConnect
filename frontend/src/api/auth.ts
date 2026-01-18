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
        accessToken?: string;
        user?: {
            id: string;
            name: string;
            email: string;
            role: string;
            department?: string;
            avatarUrl?: string;
            profileCompleted?: boolean;
        };
        message?: string;
    };
}

const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', data);
        if (response.data.success && response.data.data.accessToken) {
            setToken(response.data.data.accessToken);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    verifyEmail: async (token: string) => {
        const response = await apiClient.get(`/auth/verify-email/${token}`);
        return response.data;
    },

    resendVerification: async (email: string) => {
        const response = await apiClient.post('/auth/resend-verification', { email });
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, password: string) => {
        const response = await apiClient.post(`/auth/reset-password/${token}`, { password });
        return response.data;
    },

    checkProfileStatus: async () => {
        const response = await apiClient.get('/auth/profile-status');
        return response.data;
    },

    get: apiClient.get.bind(apiClient),
    post: apiClient.post.bind(apiClient),
    put: apiClient.put.bind(apiClient),
};

export { authApi };
export default authApi;
