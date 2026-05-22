import { apiRequest } from './apiClient';
import type {
  ClinicalFilters,
  ClinicalRecord,
  ClinicalRecordInput,
  CreateRecordResponse,
} from '../types/clinical';

function buildQuery(filters?: ClinicalFilters) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.status) params.set('status', filters.status);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function listRecords(petId: string, filters?: ClinicalFilters) {
  return apiRequest<{ records: ClinicalRecord[] }>(
    `/patients/${petId}/records${buildQuery(filters)}`,
  );
}

export function getRecord(petId: string, recordId: string) {
  return apiRequest<{ record: ClinicalRecord }>(
    `/patients/${petId}/records/${recordId}`,
  );
}

// Escenario 4 — Envía la nueva consulta al servicio clinical-history (POST).
export function createRecord(petId: string, data: ClinicalRecordInput) {
  return apiRequest<CreateRecordResponse>(`/patients/${petId}/records`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRecord(petId: string, recordId: string, data: ClinicalRecordInput) {
  return apiRequest<{ record: ClinicalRecord }>(
    `/patients/${petId}/records/${recordId}`,
    { method: 'PUT', body: JSON.stringify(data) },
  );
}

export function deleteRecord(petId: string, recordId: string) {
  return apiRequest<{ message: string }>(
    `/patients/${petId}/records/${recordId}`,
    { method: 'DELETE' },
  );
}
