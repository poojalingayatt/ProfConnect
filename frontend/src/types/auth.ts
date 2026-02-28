export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}
