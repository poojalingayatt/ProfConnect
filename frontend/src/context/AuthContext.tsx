import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, RegisterInput, User, UserRole } from '@/types/auth';
import { api, isAxiosError } from '@/lib/api';
import { token } from '@/lib/token';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUserRole = (value: unknown): value is UserRole => value === 'STUDENT' || value === 'FACULTY';

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
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
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
