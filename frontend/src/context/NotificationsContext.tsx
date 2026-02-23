import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '@/api/notifications';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { token } from '@/lib/token';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user && !!token.get(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Setup socket listener after auth boot
  useEffect(() => {
    const currentToken = token.get();
    if (!user || !currentToken) return;

    const socket = initSocket(currentToken);

    socket.on('new_notification', (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
        if (old.find(n => n.id === notification.id)) return old;
        return [notification, ...old];
      });
    });

    return () => {
      socket.off('new_notification');
    };
  }, [user, queryClient]);

  // Cleanup socket connection
  useEffect(() => {
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('new_notification');
        socket.disconnect();
        disconnectSocket();
      }
    };
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
};
