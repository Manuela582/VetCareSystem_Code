export type ClinicalStatus = 'ACTIVA' | 'SEGUIMIENTO' | 'CERRADA' | 'URGENTE';

export interface ClinicalRecord {
  id: string;
  petId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  vaccines: string[];
  observations: string;
  status: ClinicalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalRecordInput {
  date: string;
  diagnosis: string;
  treatment: string;
  vaccines: string[];
  observations: string;
  status: ClinicalStatus;
}

export interface ClinicalFilters {
  search?: string;
  from?: string;
  to?: string;
  status?: ClinicalStatus | '';
}

export interface CreateRecordResponse {
  record: ClinicalRecord;
  autoReminders?: import('./reminder').Reminder[];
}
