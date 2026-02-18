import { api } from '@/lib/api';

export interface CreateAppointmentPayload {
  facultyId: number;
  date: string;
  time: string;
  title: string;
  description?: string;
}

export const getAppointments = async () => {
  const res = await api.get('/appointments');
  return res.data.appointments;
};

export const cancelAppointment = async (id: number) => {
  await api.patch(`/appointments/${id}/cancel`);
};

export const createAppointment = async (
  payload: CreateAppointmentPayload
) => {
  const response = await api.post('/appointments', payload);
  return response.data;
};

export const acceptAppointment = async (id: number) => {
  await api.patch(`/appointments/${id}/accept`);
};

export const rejectAppointment = async (id: number) => {
  await api.patch(`/appointments/${id}/reject`);
};

export const requestReschedule = async (
  id: number,
  payload: { date: string; slot: string }
) => {
  await api.patch(`/appointments/${id}/request-reschedule`, payload);
};

export const approveReschedule = async (id: number) => {
  await api.patch(`/appointments/${id}/approve-reschedule`);
};

export const rejectReschedule = async (id: number) => {
  await api.patch(`/appointments/${id}/reject-reschedule`);
};