import apiClient from './client';

export interface AvailabilitySlot {
    start: string;
    end: string;
}

export interface AvailabilityBreak {
    start: string;
    end: string;
    label?: string;
}

export interface DayAvailability {
    day: number;
    slots: AvailabilitySlot[];
    breaks: AvailabilityBreak[];
}

export interface UpdateAvailabilityRequest {
    week: DayAvailability[];
}

export const availabilityApi = {
    getAvailability: async (facultyId: string) => {
        const response = await apiClient.get(`/availability/${facultyId}`);
        return response.data;
    },

    updateMyAvailability: async (data: UpdateAvailabilityRequest) => {
        const response = await apiClient.patch('/availability/me', data);
        return response.data;
    },
};
