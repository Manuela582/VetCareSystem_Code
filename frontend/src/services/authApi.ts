import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/auth';
import { apiRequest } from './apiClient';

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function getMe() {
  return apiRequest<{ user: User }>('/auth/me');
}

export function updateProfile(fullName: string) {
  return apiRequest<{ user: User }>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ fullName }),
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
