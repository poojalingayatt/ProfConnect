import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { students, faculty, Student, Faculty } from '@/data/users';

type UserType = 'student' | 'faculty' | null;

interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  type: UserType;
  department: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userType: UserType;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  getStudentData: () => Student | null;
  getFacultyData: () => Faculty | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userType, setUserType] = useState<UserType>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('profconnect_user');
    const storedType = localStorage.getItem('profconnect_user_type');
    
    if (storedUser && storedType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedType as UserType);
    }
  }, []);

  const login = (email: string, password: string): { success: boolean; message: string } => {
    const normalizedEmail = email.toLowerCase();
    
    // Check students
    const student = students.find(
      s => s.email.toLowerCase() === normalizedEmail && s.password === password
    );
    
    if (student) {
      const authUser: AuthUser = {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        type: 'student',
        department: student.department,
      };
      setUser(authUser);
      setUserType('student');
      localStorage.setItem('profconnect_user', JSON.stringify(authUser));
      localStorage.setItem('profconnect_user_type', 'student');
      return { success: true, message: 'Login successful!' };
    }
    
    // Check faculty
    const facultyMember = faculty.find(
      f => f.email.toLowerCase() === normalizedEmail && f.password === password
    );
    
    if (facultyMember) {
      const authUser: AuthUser = {
        id: facultyMember.id,
        name: facultyMember.name,
        email: facultyMember.email,
        avatar: facultyMember.avatar,
        type: 'faculty',
        department: facultyMember.department,
      };
      setUser(authUser);
      setUserType('faculty');
      localStorage.setItem('profconnect_user', JSON.stringify(authUser));
      localStorage.setItem('profconnect_user_type', 'faculty');
      return { success: true, message: 'Login successful!' };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('profconnect_user');
    localStorage.removeItem('profconnect_user_type');
  };

  const getStudentData = (): Student | null => {
    if (!user || userType !== 'student') return null;
    return students.find(s => s.id === user.id) || null;
  };

  const getFacultyData = (): Faculty | null => {
    if (!user || userType !== 'faculty') return null;
    return faculty.find(f => f.id === user.id) || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        login,
        logout,
        getStudentData,
        getFacultyData,
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
