import { api } from '@/lib/api';

export const getFacultyAvailability = async (facultyId: number) => {
  const response = await api.get(`/availability/faculty/${facultyId}`);
  return response.data.availability;
};