import { api } from '@/lib/api';

export interface CreateAppointmentPayload {
  facultyId: number;
  date: string;
  slot: string;
  title: string;
  description?: string;
}

export interface AppointmentListItem {
  id: number;
  studentId: number;
  facultyId: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  slot: string;
  duration?: number;
  status: string;
  rejectionReason?: string;
  hasReviewed?: boolean;
  conversationId?: number | null;
  faculty?: {
    id: number;
    name: string;
    email: string;
    facultyProfile?: {
      officeLocation?: string;
    };
  };
  student?: {
    id: number;
    name: string;
    email: string;
    department?: string;
  };
}

export const getAppointments = async (): Promise<AppointmentListItem[]> => {
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

export const acceptAppointment = async ({ id, duration }: { id: number; duration: number }) => {
  await api.patch(`/appointments/${id}/accept`, { duration });
};

export const rejectAppointment = async ({ id, reason }: { id: number; reason: string }) => {
  await api.patch(`/appointments/${id}/reject`, { reason });
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
