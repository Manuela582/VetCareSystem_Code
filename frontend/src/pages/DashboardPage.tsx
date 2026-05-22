import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ClinicalStatusBadge } from '../components/ClinicalStatusBadge';
import { useAuth } from '../context/AuthContext';
import * as dashboardApi from '../services/dashboardApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { MainDashboard } from '../types/dashboard';
import type { ClinicalStatus } from '../types/clinical';

function SimpleBarChart({
  data,
  labels,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="bar-chart">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="bar-chart__item">
          <div
            className="bar-chart__bar"
            style={{ height: `${(val / max) * 100}%` }}
            title={`${val}`}
          />
          <span className="bar-chart__label">{labels[key] || key}</span>
          <span className="bar-chart__value">{val}</span>
        </div>
      ))}
    </div>
  );
}

const reminderStatusClass: Record<string, string> = {
  PENDIENTE: 'status--activa',
  VENCIDO: 'status--urgente',
  COMPLETADO: 'status--cerrada',
};

const REMINDER_STATUS_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  COMPLETADO: 'Completado',
};

export function DashboardPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('VETERINARIO', 'ADMIN');

  // Duenos no tienen acceso al dashboard analítico — van a su panel
  if (!canManage) return <Navigate to="/panel/dueno" replace />;
  const [data, setData] = useState<MainDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .getMainDashboard()
      .then(setData)
      .catch((e) => setError(getAuthErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const pendingControls =
    data?.activeAlerts.filter((a) => a.type === 'CONTROL') ?? [];
  const firstPetId = data?.recentConsultations[0]?.petId;

  return (
    <AppLayout title="Dashboard">
      {canManage && (
        <p className="page-role-banner" role="note">
          <strong>Vista analítica</strong> — gráficos y resumen global. Para el día a día usa{' '}
          <Link to="/panel/veterinario">Panel veterinario</Link>.
        </p>
      )}

      {error && <p className="auth-error">{error}</p>}

      {loading && (
        <div className="dashboard-stats">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && data && (
        <>
          <section className="dashboard-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Mascotas</span>
              <strong>{data.stats.totalPets}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Consultas</span>
              <strong>{data.stats.totalRecords}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Recordatorios pendientes</span>
              <strong>{data.stats.pendingReminders}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--accent">
              <span className="admin-stat-label">Alertas / vencidos</span>
              <strong>{data.stats.overdueReminders}</strong>
            </div>
          </section>

          {canManage && (
            <div className="dashboard-quick-bar vet-panel-actions">
              <Link to="/mascotas/nueva" className="btn-primary vet-panel-actions__btn">
                + Registrar mascota
              </Link>
              {firstPetId && (
                <Link
                  to={`/mascotas/${firstPetId}/historial/nueva`}
                  className="btn-outline vet-panel-actions__btn"
                >
                  + Nueva consulta
                </Link>
              )}
              <Link to="/recordatorios" className="btn-outline vet-panel-actions__btn">
                Recordatorios
              </Link>
              <Link to="/panel/veterinario" className="btn-text vet-panel-actions__link">
                Panel operativo →
              </Link>
            </div>
          )}

          <div className="dashboard-grid">
            <section className="dashboard-panel">
              <h2>Próximas vacunas</h2>
              {data.upcomingVaccines.length === 0 ? (
                <EmptyState title="Sin vacunas próximas" />
              ) : (
                <ul className="dashboard-list">
                  {data.upcomingVaccines.map((v) => (
                    <li key={v.id}>
                      <div className="dashboard-list__row">
                        <Link to={`/mascotas/${v.petId}`}>
                          <strong>{v.petName || 'Mascota'}</strong>
                        </Link>
                        <span
                          className={`clinical-status ${reminderStatusClass[v.status] || 'status--activa'}`}
                        >
                          {REMINDER_STATUS_LABEL[v.status] || v.status}
                        </span>
                      </div>
                      <span className="dashboard-list__sub">
                        <Link to="/recordatorios">{v.title}</Link>
                        {' · '}
                        {new Date(v.dueDate).toLocaleDateString('es-CO')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {canManage && (
              <section className="dashboard-panel">
                <h2>Controles pendientes</h2>
                {pendingControls.length === 0 ? (
                  <EmptyState title="Sin controles pendientes" />
                ) : (
                  <ul className="dashboard-list">
                    {pendingControls.map((c) => (
                      <li key={c.id}>
                        <div className="dashboard-list__row">
                          <Link to={`/mascotas/${c.petId}/historial`}>{c.title}</Link>
                          <span
                            className={`clinical-status ${reminderStatusClass[c.status] || ''}`}
                          >
                            {REMINDER_STATUS_LABEL[c.status] || c.status}
                          </span>
                        </div>
                        <span className="dashboard-list__sub">
                          <Link to={`/mascotas/${c.petId}`}>{c.petName || 'Mascota'}</Link>
                          {' · '}
                          {new Date(c.dueDate).toLocaleDateString('es-CO')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="dashboard-panel">
              <h2>Alertas activas</h2>
              {data.activeAlerts.length === 0 ? (
                <EmptyState title="Sin alertas" />
              ) : (
                <ul className="dashboard-list dashboard-list--alerts">
                  {data.activeAlerts.map((a) => (
                    <li key={a.id}>
                      <div className="dashboard-list__row">
                        <Link to={`/mascotas/${a.petId}/historial`}>{a.title}</Link>
                        <span className="clinical-status status--urgente">
                          {REMINDER_STATUS_LABEL[a.status] || a.status}
                        </span>
                      </div>
                      <span className="dashboard-list__sub">
                        <Link to={`/mascotas/${a.petId}`}>{a.petName || 'Mascota'}</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel dashboard-panel--wide">
              <h2>Últimas consultas</h2>
              {data.recentConsultations.length === 0 ? (
                <EmptyState
                  title="Sin consultas recientes"
                  action={<Link to="/mascotas">Ver mascotas</Link>}
                />
              ) : (
                <ul className="dashboard-list">
                  {data.recentConsultations.map((c) => (
                    <li key={c.id}>
                      <Link to={`/mascotas/${c.petId}/historial`}>
                        <strong>{c.petName}</strong> — {c.diagnosis}
                      </Link>
                      <span className="dashboard-list__meta">
                        {new Date(c.date).toLocaleDateString('es-CO')}
                        {c.status && (
                          <ClinicalStatusBadge status={c.status as ClinicalStatus} />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel">
              <h2>Consultas por estado</h2>
              <SimpleBarChart
                data={data.charts.recordsByStatus}
                labels={{
                  ACTIVA: 'Activa',
                  SEGUIMIENTO: 'Seg.',
                  CERRADA: 'Cerrada',
                  URGENTE: 'Urgente',
                }}
              />
            </section>

            <section className="dashboard-panel">
              <h2>Recordatorios por tipo</h2>
              <SimpleBarChart
                data={data.charts.remindersByType}
                labels={{ VACUNA: 'Vacuna', CONTROL: 'Control', TRATAMIENTO: 'Trat.' }}
              />
            </section>
          </div>
        </>
      )}
    </AppLayout>
  );
}
