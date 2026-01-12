import apiClient from './client';

export interface CreateAppointmentRequest {
    facultyId: string;
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    location?: string;
}

export interface RescheduleRequest {
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

export const appointmentsApi = {
    getMyAppointments: async () => {
        const response = await apiClient.get('/appointments/me');
        return response.data;
    },

    getAppointment: async (id: string) => {
        const response = await apiClient.get(`/appointments/${id}`);
        return response.data;
    },

    createAppointment: async (data: CreateAppointmentRequest) => {
        const response = await apiClient.post('/appointments', data);
        return response.data;
    },

    acceptAppointment: async (id: string) => {
        const response = await apiClient.patch(`/appointments/${id}/accept`);
        return response.data;
    },

    rejectAppointment: async (id: string, message?: string) => {
        const response = await apiClient.patch(`/appointments/${id}/reject`, { message });
        return response.data;
    },

    rescheduleAppointment: async (id: string, data: RescheduleRequest) => {
        const response = await apiClient.patch(`/appointments/${id}/reschedule`, data);
        return response.data;
    },

    studentReschedule: async (id: string, data: RescheduleRequest) => {
        const response = await apiClient.patch(`/appointments/${id}/student-reschedule`, data);
        return response.data;
    },

    cancelAppointment: async (id: string, reason?: string) => {
        const response = await apiClient.patch(`/appointments/${id}/cancel`, { reason });
        return response.data;
    },

    completeAppointment: async (id: string) => {
        const response = await apiClient.patch(`/appointments/${id}/complete`);
        return response.data;
    },

    updateNotes: async (id: string, notes: string) => {
        const response = await apiClient.patch(`/appointments/${id}/notes`, { notes });
        return response.data;
    },
};
