import { apiRequest } from './apiClient';
import type { Reminder, ReminderInput, ReminderStatus, ReminderType } from '../types/reminder';

function normalizeReminders(res: unknown): { reminders: Reminder[] } {
  if (Array.isArray(res)) return { reminders: res as Reminder[] };
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    for (const key of ['reminders', 'data', 'results', 'alerts']) {
      if (Array.isArray(r[key])) return { reminders: r[key] as Reminder[] };
    }
  }
  return { reminders: [] };
}

function normalizeReminder(res: unknown): { reminder: Reminder } {
  if (res && typeof res === 'object' && !Array.isArray(res)) {
    const r = res as Record<string, unknown>;
    if (r.id || r._id) return { reminder: { ...r, id: r.id ?? r._id } as unknown as Reminder };
    for (const key of ['reminder', 'data', 'result']) {
      if (r[key] && typeof r[key] === 'object') {
        return { reminder: r[key] as Reminder };
      }
    }
  }
  if (Array.isArray(res) && res.length > 0) return { reminder: res[0] as Reminder };
  return { reminder: res as Reminder };
}

export function listReminders(filters?: {
  petId?: string;
  type?: ReminderType;
  status?: ReminderStatus;
}) {
  const params = new URLSearchParams();
  if (filters?.petId)  params.set('petId',  filters.petId);
  if (filters?.type)   params.set('type',   filters.type);
  if (filters?.status) params.set('status', filters.status);
  const q = params.toString();
  return apiRequest<unknown>(`/reminders${q ? `?${q}` : ''}`)
    .then(res => {
      console.log('[remindersApi] GET /reminders response:', res);
      return normalizeReminders(res);
    });
}

export function createReminder(data: ReminderInput) {
  return apiRequest<unknown>('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => {
    console.log('[remindersApi] POST /reminders response:', res);
    return normalizeReminder(res);
  });
}

export function updateReminder(id: string, data: Partial<ReminderInput & { status: ReminderStatus }>) {
  return apiRequest<unknown>(`/reminders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(normalizeReminder);
}

export function completeReminder(id: string) {
  return apiRequest<unknown>(`/reminders/${id}/complete`, { method: 'PATCH' })
    .then(normalizeReminder);
}

export function confirmReminder(id: string) {
  return apiRequest<unknown>(`/reminders/${id}/confirm`, { method: 'PATCH' })
    .then(normalizeReminder);
}

export function deleteReminder(id: string) {
  return apiRequest<{ message: string }>(`/reminders/${id}`, { method: 'DELETE' });
}
