import type { User, UserRole } from './auth';

export interface ServiceHealth {
  id: string;
  name: string;
  port: number;
  status: 'ok' | 'down';
  version: string | null;
  online?: boolean;
  health?: 'healthy' | 'unhealthy';
}

export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    blocked: number;
    byRole: Record<UserRole, number>;
  };
  pets: number;
  clinicalRecords: number;
  reminders: number;
  recordsByStatus: Record<string, number>;
  services: ServiceHealth[];
  security: { failedLogins24h: number };
  architecture: {
    style: string;
    communication: string;
    repository: string;
    qualityAttributes: string[];
  };
}

export interface AdminUserInput {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface FailedLoginAttempt {
  id: string;
  email: string;
  at: string;
  reason: string;
}

export interface SystemLogEntry {
  id: string;
  level: string;
  message: string;
  meta?: Record<string, unknown>;
  at: string;
}

export interface SystemErrorEntry {
  id: string;
  message: string;
  meta?: Record<string, unknown>;
  at: string;
}

export interface BroadcastEntry {
  id: string;
  subject: string;
  body: string;
  targetRole: string;
  recipients: number;
  status: 'SENT' | 'ERROR' | 'PENDING';
  sentAt: string;
  error?: string;
}

export type { User };
