import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as petsApi from '../services/petsApi';
import * as remindersApi from '../services/remindersApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Pet } from '../types/pet';
import type { Reminder, ReminderStatus, ReminderType } from '../types/reminder';

const TYPE_LABELS: Record<ReminderType, string> = {
  VACUNA: 'Vacuna',
  CONTROL: 'Control',
  TRATAMIENTO: 'Tratamiento',
};

const STATUS_LABELS: Record<ReminderStatus, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  VENCIDO: 'Vencido',
};

const statusClass: Record<ReminderStatus, string> = {
  PENDIENTE: 'status--activa',
  COMPLETADO: 'status--cerrada',
  VENCIDO: 'status--urgente',
};

export function DuenoPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, r] = await Promise.all([petsApi.listPets(), remindersApi.listReminders()]);
      const petList = p.pets;
      const petIds = new Set(petList.map((x) => x.id));
      const pending = r.reminders.filter((x) => x.status !== 'COMPLETADO');
      const filtered =
        user?.role === 'DUENO' ? pending.filter((x) => petIds.has(x.petId)) : pending;

      setPets(petList);
      setReminders(filtered.slice(0, 8));
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm(id: string) {
    try {
      await remindersApi.confirmReminder(id);
      showSuccess('Asistencia confirmada');
      await load();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  const upcomingCount = reminders.filter((r) => r.status === 'PENDIENTE').length;
  const overdueCount = reminders.filter((r) => r.status === 'VENCIDO').length;

  return (
    <AppLayout title="Panel dueño de mascota">
      <div className="dueno-readonly-banner" role="note">
        <strong>Solo lectura</strong> en historial clínico: puedes consultar vacunas, tratamientos y
        citas. No puedes editar consultas ni eliminar registros (RBAC — PDF).
      </div>

      {user?.role === 'ADMIN' && (
        <p className="dueno-admin-hint">
          Vista administrador: en este panel un dueño solo vería <em>sus</em> mascotas. Tú ves el
          listado completo del sistema para supervisión.
        </p>
      )}

      {error && <p className="auth-error">{error}</p>}

      {loading && (
        <div className="dashboard-stats">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && (
        <>
          <section className="dashboard-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Mis mascotas</span>
              <strong>{pets.length}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--warn">
              <span className="admin-stat-label">Citas / recordatorios</span>
              <strong>{reminders.length}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Próximas</span>
              <strong>{upcomingCount}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--accent">
              <span className="admin-stat-label">Vencidos</span>
              <strong>{overdueCount}</strong>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="dashboard-panel dashboard-panel--wide">
              <h2>Mis mascotas</h2>
              {pets.length === 0 ? (
                <EmptyState
                  title="Sin mascotas registradas"
                  description="Cuando el veterinario registre tus mascotas, aparecerán aquí."
                  action={
                    <Link to="/mascotas" className="btn-primary dueno-panel-actions__btn">
                      Ir a mascotas
                    </Link>
                  }
                />
              ) : (
                <ul className="dueno-pets-grid">
                  {pets.map((p) => (
                    <li key={p.id} className="dueno-pet-card">
                      <Link to={`/mascotas/${p.id}`} className="dueno-pet-card__main">
                        <span className="dueno-pet-card__icon" aria-hidden>
                          🐾
                        </span>
                        <div>
                          <h3>{p.name}</h3>
                          <p>
                            {p.species} · {p.breed}
                          </p>
                          <span className="dueno-pet-card__meta">
                            {p.age} años · {p.weight} kg
                          </span>
                        </div>
                      </Link>
                      <div className="dueno-pet-card__actions">
                        <Link
                          to={`/mascotas/${p.id}/historial`}
                          className="btn-outline dueno-panel-actions__btn"
                        >
                          Historial clínico
                        </Link>
                        <Link
                          to={`/mascotas/${p.id}#notas-dueno`}
                          className="btn-outline dueno-panel-actions__btn"
                        >
                          Info complementaria
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel dashboard-panel--wide">
              <div className="dueno-panel-section-head">
                <h2>Próximas citas y recordatorios</h2>
                <Link to="/recordatorios" className="btn-outline dueno-panel-actions__btn">
                  Ver todos
                </Link>
              </div>
              {reminders.length === 0 ? (
                <EmptyState title="Sin recordatorios pendientes" />
              ) : (
                <ul className="dashboard-list">
                  {reminders.map((r) => (
                    <li key={r.id} className="dueno-reminder-item">
                      <div className="dashboard-list__row">
                        <strong>{r.title}</strong>
                        <span className={`clinical-status ${statusClass[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      <span className="dashboard-list__sub">
                        <strong>{r.petName}</strong> ·{' '}
                        {new Date(r.dueDate).toLocaleDateString('es-CO')} · {TYPE_LABELS[r.type]}
                        {r.confirmed && (
                          <span className="dashboard-list__tag"> · Confirmado</span>
                        )}
                      </span>
                      {r.message && <p className="dueno-reminder-msg">{r.message}</p>}
                      {r.status !== 'COMPLETADO' && !r.confirmed && (
                        <button
                          type="button"
                          className="btn-outline dueno-panel-actions__btn dueno-confirm-btn"
                          onClick={() => handleConfirm(r.id)}
                        >
                          Confirmar asistencia
                        </button>
                      )}
                      {r.confirmed && r.status !== 'COMPLETADO' && (
                        <span className="dueno-confirmed-label">
                          ✓ Asistencia confirmada
                          {r.confirmedAt &&
                            ` · ${new Date(r.confirmedAt).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}`}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel">
              <h2>Seguimiento y notificaciones</h2>
              <ul className="dueno-features-list">
                <li>Consultar historial clínico de tus mascotas</li>
                <li>Ver vacunas y tratamientos registrados</li>
                <li>Recibir alertas en el centro de notificaciones (campana)</li>
                <li>Actualizar datos personales en Mi perfil</li>
              </ul>
              <Link to="/perfil" className="btn-outline dueno-panel-actions__btn">
                Editar perfil
              </Link>
            </section>
          </div>
        </>
      )}

      <footer className="dueno-panel-footer">
        <h2 className="dueno-panel-footer__title">Acciones rápidas</h2>
        <div className="dueno-panel-actions">
          <Link to="/mascotas" className="btn-primary dueno-panel-actions__btn">
            Mis mascotas
          </Link>
          <Link to="/recordatorios" className="btn-outline dueno-panel-actions__btn">
            Recordatorios
          </Link>
          <Link to="/perfil" className="btn-outline dueno-panel-actions__btn">
            Mi perfil
          </Link>
          <Link to="/inicio" className="btn-text dueno-panel-actions__link">
            Dashboard general
          </Link>
        </div>
      </footer>
    </AppLayout>
  );
}
