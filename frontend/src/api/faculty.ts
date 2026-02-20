import { api } from '@/lib/api';
import { Faculty, FacultyListFilters } from '@/types/faculty';

export const facultyApi = {
  getFacultyList: async (filters?: FacultyListFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.online !== undefined) params.append('online', filters.online.toString());
    if (filters?.hasAvailability !== undefined) params.append('hasAvailability', filters.hasAvailability.toString());

    const response = await api.get(`/faculty?${params.toString()}`);
    return response.data as Faculty[];
  },

  getFacultyById: async (id: number) => {
    const response = await api.get(`/faculty/${id}`);
    return response.data as Faculty;
  },

  followFaculty: async (facultyId: number) => {
    const response = await api.post(`/follows/${facultyId}`);
    return response.data;
  },

  unfollowFaculty: async (facultyId: number) => {
    const response = await api.delete(`/follows/${facultyId}`);
    return response.data;
  },

  getMyFollowed: async () => {
    const response = await api.get('/follows/my-followed');
    return response.data as Faculty[];
  },

  getMyFollowers: async () => {
    const response = await api.get('/follows/my-followers');
    return response.data as Faculty[];
  },

  getMyFollowedIds: async () => {
    const response = await api.get('/follows/my-followed');
    return response.data.map((faculty: any) => faculty.id) as number[];
  },

  getMyProfile: async () => {
    const response = await api.get('/faculty/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/faculty/profile', data);
    return response.data;
  },
};