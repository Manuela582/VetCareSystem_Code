import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ClinicalStatusBadge } from '../components/ClinicalStatusBadge';
import * as dashboardApi from '../services/dashboardApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { MainDashboard } from '../types/dashboard';
import type { ClinicalStatus } from '../types/clinical';
import type { Pet } from '../types/pet';

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

export function VeterinarioPage() {
  const [data, setData] = useState<MainDashboard | null>(null);
  const [recentPets, setRecentPets] = useState<Pet[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function loadDashboard() {
      setLoading(true);
      setError('');
      Promise.all([dashboardApi.getMainDashboard(), petsApi.listPets()])
        .then(([dash, petsRes]) => {
          if (cancelled) return;
          setData(dash);
          setRecentPets(petsRes.pets.slice(0, 5));
        })
        .catch((e) => {
          if (!cancelled) setError(getAuthErrorMessage(e));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    loadDashboard();
    const onFocus = () => loadDashboard();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const pendingControls =
    data?.activeAlerts.filter((a) => a.type === 'CONTROL') ?? [];
  const importantAlerts =
    data?.activeAlerts.filter((a) => a.status === 'VENCIDO' || a.type === 'TRATAMIENTO') ?? [];

  const firstPetId = recentPets[0]?.id ?? data?.recentConsultations[0]?.petId;

  return (
    <AppLayout title="Panel veterinario">
      <p className="page-role-banner" role="note">
        <strong>Vista operativa del día</strong> — vacunas, controles y alertas con acceso directo.
        Para gráficos agregados usa <Link to="/inicio">Dashboard analítico</Link>.
      </p>

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
              <span className="admin-stat-label">Consultas médicas</span>
              <strong>{data.stats.totalRecords}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--warn">
              <span className="admin-stat-label">Recordatorios pendientes</span>
              <strong>{data.stats.pendingReminders}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--accent">
              <span className="admin-stat-label">Alertas activas</span>
              <strong>{data.stats.activeAlerts}</strong>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="dashboard-panel">
              <h2>Próximas vacunas</h2>
              {data.upcomingVaccines.length === 0 ? (
                <EmptyState title="Sin vacunas programadas" />
              ) : (
                <ul className="dashboard-list">
                  {data.upcomingVaccines.map((v) => (
                    <li key={v.id}>
                      <div className="dashboard-list__row">
                        <Link to={`/mascotas/${v.petId}/historial`}>
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

            <section className="dashboard-panel">
              <h2>Alertas importantes</h2>
              {importantAlerts.length === 0 ? (
                <EmptyState title="Sin alertas críticas" />
              ) : (
                <ul className="dashboard-list dashboard-list--alerts">
                  {importantAlerts.map((a) => (
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

            <section className="dashboard-panel">
              <h2>Mascotas recientes</h2>
              {recentPets.length === 0 ? (
                <EmptyState
                  title="Sin mascotas"
                  action={
                    <Link to="/mascotas/nueva" className="btn-primary vet-panel-actions__btn">
                      Registrar mascota
                    </Link>
                  }
                />
              ) : (
                <ul className="dashboard-list">
                  {recentPets.map((p) => (
                    <li key={p.id}>
                      <div className="dashboard-list__row">
                        <Link to={`/mascotas/${p.id}`}>
                          <strong>{p.name}</strong>
                        </Link>
                        <span className="dashboard-list__tag">{p.species}</span>
                      </div>
                      <span className="dashboard-list__sub">
                        {p.breed} · Dueño: {p.ownerName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel dashboard-panel--wide">
              <h2>Consultas recientes</h2>
              {data.recentConsultations.length === 0 ? (
                <EmptyState
                  title="Sin consultas"
                  action={
                    <Link to="/mascotas" className="btn-outline vet-panel-actions__btn">
                      Ver mascotas
                    </Link>
                  }
                />
              ) : (
                <ul className="dashboard-list">
                  {data.recentConsultations.map((c) => (
                    <li key={c.id}>
                      <div className="dashboard-list__row">
                        <Link to={`/mascotas/${c.petId}/historial`}>
                          <strong>{c.petName}</strong>
                        </Link>
                        {c.status && (
                          <ClinicalStatusBadge status={c.status as ClinicalStatus} />
                        )}
                      </div>
                      <span className="dashboard-list__sub">
                        {c.diagnosis} · {new Date(c.date).toLocaleDateString('es-CO')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <footer className="vet-panel-footer">
        <h2 className="vet-panel-footer__title">Acciones rápidas</h2>
        <div className="vet-panel-actions">
          <Link to="/mascotas" className="btn-primary vet-panel-actions__btn">
            Gestionar mascotas
          </Link>
          {firstPetId && (
            <Link
              to={`/mascotas/${firstPetId}/historial/nueva`}
              className="btn-primary vet-panel-actions__btn"
            >
              + Nueva consulta
            </Link>
          )}
          <Link to="/mascotas/nueva" className="btn-outline vet-panel-actions__btn">
            Registrar mascota
          </Link>
          <Link to="/recordatorios" className="btn-outline vet-panel-actions__btn">
            Recordatorios
          </Link>
          <Link to="/inicio" className="btn-text vet-panel-actions__link">
            Dashboard analítico →
          </Link>
        </div>
        <p className="admin-hint">
          Busca por nombre, dueño, vacuna o fecha en Patients. Revisa el icono de notificaciones para alertas IN_APP del paciente.
        </p>
      </footer>
    </AppLayout>
  );
}
