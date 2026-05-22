import { getTokenExpiresAtMs } from '../utils/jwt';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  User,
  UserRole,
} from '../types/auth';
import { apiRequest } from './apiClient';

// ─── Tipos del backend (pueden diferir del frontend) ──────────────────────────

interface BackendUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role: string;
  phone?: string;
  active?: boolean;
  blocked?: boolean;
}

interface BackendAuthResponse {
  token: string;
  user: BackendUser;
  expiresAt?: number;
}

// ─── Mapeo de roles backend ↔ frontend ────────────────────────────────────────

const ROLE_TO_FRONTEND: Record<string, UserRole> = {
  dueno:          'DUENO',
  veterinario:    'VETERINARIO',
  administrador:  'ADMIN',
  DUENO:          'DUENO',
  VETERINARIO:    'VETERINARIO',
  ADMIN:          'ADMIN',
};

const ROLE_TO_BACKEND: Record<UserRole, string> = {
  DUENO:       'dueno',
  VETERINARIO: 'veterinario',
  ADMIN:       'administrador',
};

// ─── Normalización backend → frontend ─────────────────────────────────────────

function normalizeUser(raw: BackendUser): User {
  return {
    id:       raw.id,
    email:    raw.email,
    fullName: raw.fullName ?? raw.name ?? '',
    role:     ROLE_TO_FRONTEND[raw.role] ?? 'DUENO',
    phone:    raw.phone,
    active:   raw.active,
    blocked:  raw.blocked,
  };
}

function normalizeAuth(raw: BackendAuthResponse): AuthResponse {
  return {
    token:     raw.token,
    user:      normalizeUser(raw.user),
    expiresAt: raw.expiresAt ?? getTokenExpiresAtMs(raw.token) ?? Date.now() + 3_600_000,
  };
}

// ─── Payload de registro (lo que espera el backend) ───────────────────────────

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export function login(payload: LoginPayload) {
  return apiRequest<BackendAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  }).then(normalizeAuth);
}

export function register(payload: RegisterPayload) {
  return apiRequest<BackendAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name:     payload.fullName,
      email:    payload.email,
      password: payload.password,
      role:     ROLE_TO_BACKEND[payload.role],
      phone:    payload.phone,
    }),
    skipAuth: true,
  }).then(normalizeAuth);
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function getMe() {
  return apiRequest<BackendUser | { user: BackendUser }>('/auth/me').then((res) => {
    // el backend puede devolver el usuario directo o envuelto en { user: {...} }
    const raw = (res as BackendUser).id
      ? (res as BackendUser)
      : (res as { user: BackendUser }).user;
    return { user: normalizeUser(raw) };
  });
}

export function updateProfile(fullName: string) {
  return apiRequest<BackendUser | { user: BackendUser }>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ name: fullName }),
  }).then((res) => {
    const raw = (res as BackendUser).id
      ? (res as BackendUser)
      : (res as { user: BackendUser }).user;
    return { user: normalizeUser(raw) };
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
