import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, RegisterInput, User, UserRole } from '@/types/auth';
import { api, isAxiosError } from '@/lib/api';
import { token } from '@/lib/token';
import { disconnectSocket, getOrCreateSocket, initSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUserRole = (value: unknown): value is UserRole =>
  value === 'STUDENT' || value === 'FACULTY' || value === 'ADMIN';

const normalizeUser = (raw: any): User => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid user payload');
  }

  const role = raw.role;
  if (!isUserRole(role)) {
    throw new Error('Invalid user role');
  }

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    role,
    department: raw.department ? String(raw.department) : undefined,
    avatar: raw.avatar ? String(raw.avatar) : undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Single-run boot logic - runs exactly once on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const currentToken = token.get();

      // No token = not authenticated, skip API call
      if (!currentToken) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // Single API call to validate token and get user
        const res = await api.get('/auth/me');

        // Normalize user data
        const rawUser = (res.data && (res.data.user ?? res.data.data?.user)) ?? res.data;
        const authenticatedUser = normalizeUser(rawUser);

        if (mounted) {
          setUser(authenticatedUser);
          // Initialize socket connection for existing session
          initSocket(currentToken);
        }
      } catch (err) {
        // Any error (401 or network) = invalid session
        if (isAxiosError(err)) {
          token.remove();
        }
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - runs once

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await api.post<AuthResponse>('/auth/login', { email, password });
        const nextToken = res.data.accessToken;
        const nextUser = normalizeUser(res.data.user);

        token.set(nextToken);
        setUser(nextUser);

        // Initialize socket connection after successful login
        initSocket(nextToken);

        return nextUser;
      } catch (err) {
        if (isAxiosError(err)) {
          const msg =
            (err.response?.data as any)?.message ||
            (err.response?.data as any)?.error ||
            'Login failed';
          throw new Error(msg);
        }
        throw err;
      }
    },
    []
  );

  const register = useCallback(async (data: RegisterInput) => {
    try {
      const res = await api.post<AuthResponse>('/auth/register', data);
      const nextToken = res.data.accessToken;
      const nextUser = normalizeUser(res.data.user);

      token.set(nextToken);
      setUser(nextUser);

      // Initialize socket connection after successful registration
      initSocket(nextToken);

      return nextUser;
    } catch (err) {
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.message ||
          (err.response?.data as any)?.error ||
          'Registration failed';
        throw new Error(msg);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    token.remove();
    setUser(null);
    disconnectSocket();
    queryClient.removeQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    console.log('👤 Current User:', user);

    const rawId = (user as User & { _id?: string | number })._id ?? user.id;
    if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
      console.warn('❌ No user ID available for socket registration');
      return;
    }

    const socket = getOrCreateSocket();
    if (!socket) {
      console.warn('❌ Socket unavailable for registration');
      return;
    }

    const userId = String(rawId);
    const registerUser = () => {
      console.log('📤 Registering user:', userId);
      socket.emit('register', userId);
    };

    if (socket.connected) {
      registerUser();
    }

    socket.on('connect', registerUser);
    return () => {
      socket.off('connect', registerUser);
    };
  }, [user]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
