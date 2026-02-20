import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '@/api/notifications';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { token } from '@/lib/token';

interface NotificationsContextType {
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user && !!token.get(),
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

    socket.on('notification', (notification) => {
      queryClient.setQueryData(['notifications'], (old: any[] = []) => {
        // Prevent duplicate notifications
        if (old.find(n => n.id === notification.id)) return old;
        return [notification, ...old];
      });
    });

    return () => {
      socket.off('notification');
    };
  }, [user, queryClient]);

  // Cleanup socket connection
  useEffect(() => {
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('notification');
        socket.disconnect();
        disconnectSocket();
      }
    };
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
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
