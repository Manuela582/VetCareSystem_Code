export type UserRole = 'VETERINARIO' | 'DUENO' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
  blocked?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ForgotPasswordPayload {
  email: string;
}
