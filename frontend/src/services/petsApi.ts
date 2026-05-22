import { apiRequest } from './apiClient';
import type { OwnerNotes, OwnerOption, Pet, PetInput } from '../types/pet';

export interface PetSearchParams {
  search?: string;
  vaccine?: string;
  from?: string;
  to?: string;
}

// Extrae un array de mascotas de cualquier forma que el backend las devuelva
function normalizePets(res: unknown): { pets: Pet[] } {
  if (Array.isArray(res)) return { pets: res as Pet[] };
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    for (const key of ['pets', 'patients', 'data', 'results']) {
      if (Array.isArray(r[key])) return { pets: r[key] as Pet[] };
    }
  }
  return { pets: [] };
}

// Extrae un único objeto mascota de cualquier forma que el backend lo devuelva
function normalizePet(res: unknown): { pet: Pet } {
  if (!res || typeof res !== 'object') throw new Error('Respuesta vacía del servidor');

  // Array con al menos un elemento
  if (Array.isArray(res)) {
    if (res.length > 0) return { pet: res[0] as Pet };
    throw new Error('El servidor devolvió un array vacío');
  }

  const r = res as Record<string, unknown>;

  // Objeto directo: tiene id o _id
  if (r.id || r._id) {
    return { pet: { ...r, id: (r.id ?? r._id) } as unknown as Pet };
  }

  // Envuelto en clave conocida
  for (const key of ['pet', 'patient', 'data', 'result']) {
    if (r[key] && typeof r[key] === 'object' && !Array.isArray(r[key])) {
      const inner = r[key] as Record<string, unknown>;
      if (inner.id || inner._id) {
        return { pet: { ...inner, id: (inner.id ?? inner._id) } as unknown as Pet };
      }
    }
  }

  // Último recurso: usar el objeto tal cual
  console.warn('[petsApi] Formato de respuesta desconocido, usando objeto completo:', res);
  return { pet: res as Pet };
}

export function listPets(params?: PetSearchParams) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.vaccine) q.set('vaccine', params.vaccine);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const query = q.toString();
  return apiRequest<unknown>(`/patients${query ? `?${query}` : ''}`)
    .then(res => {
      console.log('[petsApi] GET /patients response:', res);
      return normalizePets(res);
    });
}

export function getPet(id: string) {
  return apiRequest<unknown>(`/patients/${id}`).then(normalizePet);
}

export function createPet(data: PetInput) {
  return apiRequest<unknown>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => {
    console.log('[petsApi] POST /patients response:', res);
    return normalizePet(res);
  });
}

export function updatePet(id: string, data: PetInput) {
  return apiRequest<unknown>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }).then(normalizePet);
}

export function deletePet(id: string) {
  return apiRequest<{ message: string }>(`/patients/${id}`, { method: 'DELETE' });
}

export function listOwners() {
  return apiRequest<{ owners: OwnerOption[] }>('/users/owners');
}

export function updateOwnerNotes(id: string, notes: OwnerNotes) {
  return apiRequest<unknown>(`/patients/${id}/owner-notes`, {
    method: 'PATCH',
    body: JSON.stringify(notes),
  }).then(normalizePet);
}
