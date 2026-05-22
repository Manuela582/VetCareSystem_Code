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

export interface SendNotificationPayload {
  userId: string;
  subject: string;
  body: string;
  channel?: 'IN_APP' | 'EMAIL' | 'PUSH';
}

export function listNotifications() {
  return apiRequest<{ notifications: AppNotification[]; unread: number }>('/notifications');
}

export function sendNotification(data: SendNotificationPayload) {
  return apiRequest<{ message: string }>('/notifications/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Estos endpoints no están disponibles en el backend actual — se ignoran silenciosamente
export function markAsRead(_id: string): Promise<void> {
  return Promise.resolve();
}

export function markAllRead(): Promise<void> {
  return Promise.resolve();
}
