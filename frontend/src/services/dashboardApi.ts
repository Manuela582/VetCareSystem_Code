import { apiRequest } from './apiClient';
import type { MainDashboard, PetDashboard } from '../types/dashboard';

export function getMainDashboard() {
  return apiRequest<MainDashboard>('/dashboard');
}

export function getPetDashboard(petId: string) {
  return apiRequest<PetDashboard>(`/dashboard/${petId}`);
}
