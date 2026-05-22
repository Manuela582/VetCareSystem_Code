import { apiRequest } from './apiClient';
import type { OwnerNotes, OwnerOption, Pet, PetInput } from '../types/pet';

export interface PetSearchParams {
  search?: string;
  vaccine?: string;
  from?: string;
  to?: string;
}

export function listPets(params?: PetSearchParams) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.vaccine) q.set('vaccine', params.vaccine);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const query = q.toString();
  return apiRequest<{ pets: Pet[] }>(`/pets${query ? `?${query}` : ''}`);
}

export function getPet(id: string) {
  return apiRequest<{ pet: Pet }>(`/pets/${id}`);
}

export function createPet(data: PetInput) {
  return apiRequest<{ pet: Pet }>('/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePet(id: string, data: PetInput) {
  return apiRequest<{ pet: Pet }>(`/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deletePet(id: string) {
  return apiRequest<{ message: string }>(`/pets/${id}`, { method: 'DELETE' });
}

export function listOwners() {
  return apiRequest<{ owners: OwnerOption[] }>('/users/owners');
}

export function updateOwnerNotes(id: string, notes: OwnerNotes) {
  return apiRequest<{ pet: Pet }>(`/pets/${id}/owner-notes`, {
    method: 'PATCH',
    body: JSON.stringify(notes),
  });
}
