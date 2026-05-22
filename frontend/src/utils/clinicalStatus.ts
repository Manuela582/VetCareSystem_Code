import type { ClinicalStatus } from '../types/clinical';

export const STATUS_LABELS: Record<ClinicalStatus, string> = {
  ACTIVA: 'Activa',
  SEGUIMIENTO: 'Seguimiento',
  CERRADA: 'Cerrada',
  URGENTE: 'Urgente',
};

export const STATUS_CLASS: Record<ClinicalStatus, string> = {
  ACTIVA: 'status--activa',
  SEGUIMIENTO: 'status--seguimiento',
  CERRADA: 'status--cerrada',
  URGENTE: 'status--urgente',
};
