import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export type NotificationUserType = 'STUDENT' | 'FACULTY';

export interface AppNotification {
  id: number;
  userType: NotificationUserType;
  userId: number;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: (userType: NotificationUserType, userId: number) => void;
  getNotificationsFor: (userType: NotificationUserType, userId: number) => AppNotification[];
}

const STORAGE_KEY = 'profconnect_read_notifications';

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const readStoredReadIds = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'number');
  } catch {
    return [];
  }
};

const writeStoredReadIds = (ids: number[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return [] as AppNotification[];
  });

  useEffect(() => {
    const storedReadIds = new Set(readStoredReadIds());
    setNotifications((prev) => prev.map((n) => ({ ...n, read: n.read || storedReadIds.has(n.id) })));
  }, []);

  const getNotificationsFor = (targetUserType: NotificationUserType, targetUserId: number) => {
    return notifications.filter((n) => n.userType === targetUserType && n.userId === targetUserId);
  };

  const scopedUnreadCount = useMemo(() => {
    if (!isAuthenticated || !user) return 0;
    return getNotificationsFor(user.role, user.id).filter((n) => !n.read).length;
  }, [isAuthenticated, notifications, user]);

  const persistReadIdsFromState = (next: AppNotification[]) => {
    const readIds = next.filter((n) => n.read).map((n) => n.id);
    writeStoredReadIds(readIds);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistReadIdsFromState(next);
      return next;
    });
  };

  const markAllAsRead = (targetUserType: NotificationUserType, targetUserId: number) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.userType === targetUserType && n.userId === targetUserId ? { ...n, read: true } : n
      );
      persistReadIdsFromState(next);
      return next;
    });
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount: scopedUnreadCount,
        markAsRead,
        markAllAsRead,
        getNotificationsFor,
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
