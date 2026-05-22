export interface DashboardStats {
  totalPets: number;
  totalRecords: number;
  pendingReminders: number;
  overdueReminders: number;
  activeAlerts: number;
}

export interface DashboardVaccine {
  id: string;
  petId: string;
  petName?: string;
  title: string;
  dueDate: string;
  status: string;
  type: string;
}

export interface DashboardConsultation {
  id: string;
  petId: string;
  petName: string;
  date: string;
  diagnosis: string;
  status: string;
}

export interface MainDashboard {
  stats: DashboardStats;
  upcomingVaccines: DashboardVaccine[];
  activeAlerts: DashboardVaccine[];
  recentConsultations: DashboardConsultation[];
  charts: {
    recordsByStatus: Record<string, number>;
    remindersByType: Record<string, number>;
  };
}

import type { Pet } from './pet';
import type { ClinicalRecord } from './clinical';
import type { Reminder } from './reminder';

export interface PetDashboard {
  pet: Pet;
  records: ClinicalRecord[];
  reminders: Reminder[];
}
