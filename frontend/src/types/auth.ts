export type UserRole = 'STUDENT' | 'FACULTY';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
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
