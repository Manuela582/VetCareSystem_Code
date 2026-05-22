import { apiRequest } from './apiClient';

export interface AppNotification {
  id: string;
  channel: string;
  subject: string;
  body: string;
  read: boolean;
  status?: string;
  createdAt: string;
}

export function listNotifications() {
  return apiRequest<{ notifications: AppNotification[]; unread: number }>('/notifications');
}

export function markAsRead(id: string) {
  return apiRequest<{ notification: AppNotification }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllRead() {
  return apiRequest<{ message: string }>('/notifications/read-all', { method: 'PATCH' });
}
