import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { notifications as initialNotifications, Notification } from '@/data/appointments';
import { useAuth } from '@/context/AuthContext';

type UserType = 'student' | 'faculty';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: (userType: UserType, userId: number) => void;
  getNotificationsFor: (userType: UserType, userId: number) => Notification[];
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
  const { user, userType, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const storedReadIds = new Set(readStoredReadIds());
    return initialNotifications.map((n) => ({ ...n, read: n.read || storedReadIds.has(n.id) }));
  });

  useEffect(() => {
    const storedReadIds = new Set(readStoredReadIds());
    setNotifications((prev) => prev.map((n) => ({ ...n, read: n.read || storedReadIds.has(n.id) })));
  }, []);

  const getNotificationsFor = (targetUserType: UserType, targetUserId: number) => {
    return notifications.filter((n) => n.userType === targetUserType && n.userId === targetUserId);
  };

  const scopedUnreadCount = useMemo(() => {
    if (!isAuthenticated || !user || !userType) return 0;
    return getNotificationsFor(userType as UserType, user.id).filter((n) => !n.read).length;
  }, [isAuthenticated, notifications, user, userType]);

  const persistReadIdsFromState = (next: Notification[]) => {
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

  const markAllAsRead = (targetUserType: UserType, targetUserId: number) => {
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
