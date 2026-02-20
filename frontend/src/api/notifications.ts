import { api } from '@/lib/api';

export interface Notification {
  id: number;
  type: 'APPOINTMENT_REQUEST' | 'APPOINTMENT_ACCEPTED' | 'APPOINTMENT_REJECTED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_REMINDER' | 'NEW_FOLLOWER' | 'NEW_ANNOUNCEMENT';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data.notifications;
};

export const markAsRead = async (id: number) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  await api.patch('/notifications/read-all');
};