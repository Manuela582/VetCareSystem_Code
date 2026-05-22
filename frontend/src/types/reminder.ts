export type ReminderType = 'VACUNA' | 'CONTROL' | 'TRATAMIENTO';
export type ReminderStatus = 'PENDIENTE' | 'COMPLETADO' | 'VENCIDO';

export interface Reminder {
  id: string;
  petId: string;
  petName: string;
  type: ReminderType;
  title: string;
  dueDate: string;
  status: ReminderStatus;
  message: string;
  createdAt?: string;
  confirmed?: boolean;
  confirmedAt?: string | null;
}

export interface ReminderInput {
  petId: string;
  petName?: string;
  type: ReminderType;
  title: string;
  dueDate: string;
  message?: string;
}
