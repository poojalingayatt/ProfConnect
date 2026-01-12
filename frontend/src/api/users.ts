import apiClient from './client';

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    department?: string;
    avatarUrl?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export const usersApi = {
    getStats: async () => {
        const response = await apiClient.get('/users/stats');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest) => {
        const response = await apiClient.patch('/users/me', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordRequest) => {
        const response = await apiClient.patch('/users/me/password', data);
        return response.data;
    },
};
