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