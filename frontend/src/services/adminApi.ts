import { apiRequest } from './apiClient';
import type {
  AdminDashboard,
  AdminUserInput,
  BroadcastEntry,
  FailedLoginAttempt,
  SystemErrorEntry,
  SystemLogEntry,
  User,
} from '../types/admin';

export function getDashboard() {
  return apiRequest<AdminDashboard>('/admin/dashboard');
}

export function listUsers() {
  return apiRequest<{ users: User[] }>('/admin/users');
}

export function createUser(data: AdminUserInput) {
  return apiRequest<{ user: User }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: Partial<AdminUserInput>) {
  return apiRequest<{ user: User }>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return apiRequest<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' });
}

export function setUserActive(id: string, active: boolean) {
  return apiRequest<{ user: User }>(`/admin/users/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export function setUserBlocked(id: string, blocked: boolean) {
  return apiRequest<{ user: User }>(`/admin/users/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ blocked }),
  });
}

export function forceLogout(id: string) {
  return apiRequest<{ message: string }>(`/admin/users/${id}/force-logout`, {
    method: 'POST',
  });
}

export function getFailedLogins() {
  return apiRequest<{ attempts: FailedLoginAttempt[] }>('/admin/security/failed-logins');
}

export function getSystemLogs(limit = 50) {
  return apiRequest<{ logs: SystemLogEntry[] }>(`/admin/observability/logs?limit=${limit}`);
}

export function getSystemErrors(limit = 50) {
  return apiRequest<{ errors: SystemErrorEntry[] }>(`/admin/observability/errors?limit=${limit}`);
}

export function broadcastNotification(data: {
  subject: string;
  body: string;
  targetRole: string;
}) {
  return apiRequest<{ broadcast: BroadcastEntry }>('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getNotificationHistory() {
  return apiRequest<{ history: BroadcastEntry[] }>('/admin/notifications/history');
}
