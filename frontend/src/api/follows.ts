import apiClient from './client';

export const followsApi = {
    followFaculty: async (facultyId: string) => {
        const response = await apiClient.post(`/follows/${facultyId}`);
        return response.data;
    },

    unfollowFaculty: async (facultyId: string) => {
        const response = await apiClient.delete(`/follows/${facultyId}`);
        return response.data;
    },

    checkFollowing: async (facultyId: string) => {
        const response = await apiClient.get(`/follows/check/${facultyId}`);
        return response.data;
    },

    getMyFollows: async () => {
        const response = await apiClient.get('/follows/me');
        return response.data;
    },

    getFollowers: async () => {
        const response = await apiClient.get('/follows/followers/me');
        return response.data;
    },
};
