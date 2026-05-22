import type { ReactNode } from 'react';
import { AppLayout } from './layout/AppLayout';

/** @deprecated Usar AppLayout — se mantiene por compatibilidad */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return <AppLayout title={title}>{children}</AppLayout>;
}
