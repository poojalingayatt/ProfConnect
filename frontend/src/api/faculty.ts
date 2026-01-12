import apiClient from './client';

export interface FacultySearchParams {
    department?: string;
    specialization?: string;
    q?: string;
}

export interface UpdateFacultyProfileRequest {
    bio?: string;
    qualifications?: string[];
    specializations?: string[];
    officeLocation?: string;
}

export const facultyApi = {
    listFaculty: async (params?: FacultySearchParams) => {
        const response = await apiClient.get('/faculty', { params });
        return response.data;
    },

    getFaculty: async (id: string) => {
        const response = await apiClient.get(`/faculty/${id}`);
        return response.data;
    },

    updateMyProfile: async (data: UpdateFacultyProfileRequest) => {
        const response = await apiClient.patch('/faculty/me', data);
        return response.data;
    },

    updateStatus: async (isOnline: boolean, currentLocation?: string) => {
        const response = await apiClient.patch('/faculty/me/status', { isOnline, currentLocation });
        return response.data;
    },
};
