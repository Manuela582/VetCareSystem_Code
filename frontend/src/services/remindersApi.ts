import { apiRequest } from './apiClient';
import type { Reminder, ReminderInput, ReminderStatus, ReminderType } from '../types/reminder';

export function listReminders(filters?: {
  petId?: string;
  type?: ReminderType;
  status?: ReminderStatus;
}) {
  const params = new URLSearchParams();
  if (filters?.petId) params.set('petId', filters.petId);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  const q = params.toString();
  return apiRequest<{ reminders: Reminder[] }>(`/reminders${q ? `?${q}` : ''}`);
}

export function createReminder(data: ReminderInput) {
  return apiRequest<{ reminder: Reminder }>('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateReminder(id: string, data: Partial<ReminderInput & { status: ReminderStatus }>) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function completeReminder(id: string) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}/complete`, {
    method: 'PATCH',
  });
}

export function confirmReminder(id: string) {
  return apiRequest<{ reminder: Reminder }>(`/reminders/${id}/confirm`, {
    method: 'PATCH',
  });
}

export function deleteReminder(id: string) {
  return apiRequest<{ message: string }>(`/reminders/${id}`, { method: 'DELETE' });
}
