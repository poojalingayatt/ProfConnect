import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setToken, removeToken } from '@/api';

type UserType = 'student' | 'faculty' | null;

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserType;
  department?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userType: UserType;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, role: 'student' | 'faculty') => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load user from stored data and verify token
    const loadUser = async () => {
      const storedUser = localStorage.getItem('profconnect_user');
      const storedType = localStorage.getItem('profconnect_user_type');
      const token = localStorage.getItem('profconnect_token');

      if (storedUser && storedType && token) {
        try {
          // Verify token is still valid by fetching current user
          const response = await authApi.me();
          if (response.success) {
            const userData = response.data;
            const authUser: AuthUser = {
              _id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              avatarUrl: userData.avatarUrl,
              role: userData.role,
              department: userData.department,
              phone: userData.phone,
            };
            setUser(authUser);
            setUserType(userData.role as UserType);
            localStorage.setItem('profconnect_user', JSON.stringify(authUser));
            localStorage.setItem('profconnect_user_type', userData.role);
          }
        } catch (error) {
          // Token invalid, clear everything
          logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data.user) {
        const userData = response.data.user;
        const authUser: AuthUser = {
          _id: userData.id,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          role: userData.role as UserType,
          department: userData.department,
        };
        setUser(authUser);
        setUserType(userData.role as UserType);
        localStorage.setItem('profconnect_user', JSON.stringify(authUser));
        localStorage.setItem('profconnect_user_type', userData.role);
        return { success: true, message: 'Login successful!' };
      }

      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'faculty'): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.register({ name, email, password, role });

      if (response.success && response.data.user) {
        const userData = response.data.user;
        const authUser: AuthUser = {
          _id: userData.id,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          role: userData.role as UserType,
          department: userData.department,
        };
        setUser(authUser);
        setUserType(userData.role as UserType);
        localStorage.setItem('profconnect_user', JSON.stringify(authUser));
        localStorage.setItem('profconnect_user_type', userData.role);
        return { success: true, message: 'Registration successful!' };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    removeToken();
    localStorage.removeItem('profconnect_user');
    localStorage.removeItem('profconnect_user_type');
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.success) {
        const userData = response.data;
        const authUser: AuthUser = {
          _id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
        };
        setUser(authUser);
        setUserType(userData.role as UserType);
        localStorage.setItem('profconnect_user', JSON.stringify(authUser));
        localStorage.setItem('profconnect_user_type', userData.role);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
