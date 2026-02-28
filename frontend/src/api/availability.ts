import { api } from '@/lib/api';

export const getFacultyAvailability = async (facultyId: number) => {
  const response = await api.get(`/availability/faculty/${facultyId}`);
  return response.data.availability;
};

export const updateAvailability = async (availability: { day: string; slots: string[] }[]) => {
  const response = await api.put('/availability', { availability });
  return response.data;
};

export const updateOnlineStatus = async (isOnline: boolean) => {
  const response = await api.patch('/availability/status', { isOnline });
  return response.data;
};