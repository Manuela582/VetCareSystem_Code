import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import * as petsApi from '../services/petsApi';
import * as remindersApi from '../services/remindersApi';
import type { Pet } from '../types/pet';
import type { Reminder } from '../types/reminder';

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pending', COMPLETADO: 'Completed', VENCIDO: 'Overdue',
};
const statusClass: Record<string, string> = {
  PENDIENTE: 'status--activa', COMPLETADO: 'status--cerrada', VENCIDO: 'status--urgente',
};
const TYPE_ICON: Record<string, string> = {
  VACUNA: 'vaccines', CONTROL: 'calendar_today', TRATAMIENTO: 'medication',
};

export function DuenoPage() {
  const { user } = useAuth();
  const [pets, setPets]           = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activePetIdx, setActivePetIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [p, r] = await Promise.all([
        petsApi.listPets(),
        remindersApi.listReminders().catch(() => ({ reminders: [] })),
      ]);
      setPets(p.pets);
      setReminders(
        r.reminders
          .filter((x: Reminder) => x.status !== 'COMPLETADO')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .slice(0, 8),
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error cargando datos');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const activePet = pets[activePetIdx] ?? null;

  const overdueCount = reminders.filter(r => r.status === 'VENCIDO').length;

  return (
    <AppLayout title="My Panel">
      {/* ── Hero ── */}
      <div className="dueno-hero">
        <div className="dueno-hero__left">
          <div className="dueno-hero__paw" aria-hidden>
            <span className="material-symbols-rounded dueno-hero__paw-icon">pets</span>
          </div>
          <h2 className="dueno-hero__greeting">Hello, {firstName}.</h2>
          <p className="dueno-hero__sub">
            Your pet's health overview is up to date. Keep track of upcoming appointments and manage your consultations.
          </p>
          <Link to="/solicitar-cita" className="dueno-hero__cta">
            <span className="material-symbols-rounded">home_health</span>
            Request Vet at Home
          </Link>
        </div>

        {/* Active order / next appointment */}
        {reminders.length > 0 && (
          <div className="dueno-hero__order">
            <span className="dueno-hero__order-badge">
              <span className="material-symbols-rounded" style={{ fontSize: '0.85rem' }}>schedule</span>
              Upcoming
            </span>
            <h4 className="dueno-hero__order-title">{reminders[0].title}</h4>
            <p className="dueno-hero__order-sub">
              {reminders[0].petName || activePet?.name || 'Your pet'}
            </p>
            <div className="dueno-hero__order-time">
              <span className="material-symbols-rounded">calendar_today</span>
              <div>
                <small>Scheduled</small>
                <strong>{new Date(reminders[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {loadError && (
        <div className="auth-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>error</span>
          {loadError}
          <button type="button" className="btn-text" style={{ marginLeft: 'auto', padding: 0 }} onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="dashboard-stats">
          {[1,2,3].map(i => <div key={i} className="skeleton-card"><div className="skeleton skeleton-line--lg" /></div>)}
        </div>
      ) : (
        <div className="dueno-content">
          {/* Left: Pet card */}
          <div className="dueno-left">
            {pets.length === 0 ? (
              <div className="dueno-no-pets">
                <span className="material-symbols-rounded dueno-no-pets__icon">pets</span>
                <p>No pets registered yet.</p>
                <Link to="/mascotas/nueva" className="btn-primary">Register your first pet</Link>
              </div>
            ) : (
              <>
                {/* Pet selector tabs */}
                {pets.length > 1 && (
                  <div className="dueno-pet-tabs">
                    {pets.map((p, i) => (
                      <button key={p.id} type="button" className={`dueno-pet-tab ${activePetIdx === i ? 'dueno-pet-tab--active' : ''}`} onClick={() => setActivePetIdx(i)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {activePet && (
                  <div className="dueno-pet-detail">
                    <div className="dueno-pet-detail__header">
                      <div className="dueno-pet-detail__avatar">
                        {activePet.photo
                          ? <img src={activePet.photo} alt={activePet.name} />
                          : <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>pets</span>
                        }
                      </div>
                      <div>
                        <h3 className="dueno-pet-detail__name">{activePet.name}</h3>
                        <p className="dueno-pet-detail__meta">{activePet.species} {activePet.breed && `· ${activePet.breed}`} · {activePet.age} yrs</p>
                      </div>
                    </div>

                    <div className="dueno-pet-detail__stats">
                      <div className="dueno-pet-stat">
                        <span className="material-symbols-rounded dueno-pet-stat__icon">monitor_weight</span>
                        <span className="dueno-pet-stat__label">Weight</span>
                        <strong className="dueno-pet-stat__value">{activePet.weight} kg</strong>
                      </div>
                      {activePet.allergies && (
                        <div className="dueno-pet-stat dueno-pet-stat--warn">
                          <span className="material-symbols-rounded dueno-pet-stat__icon">warning</span>
                          <span className="dueno-pet-stat__label">Allergies</span>
                          <strong className="dueno-pet-stat__value">{activePet.allergies}</strong>
                        </div>
                      )}
                    </div>

                    <div className="dueno-pet-detail__actions">
                      <Link to={`/mascotas/${activePet.id}/historial`} className="btn-outline" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>history</span>
                        Full Medical History
                      </Link>
                      <Link to="/solicitar-cita" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 0 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>calendar_add_on</span>
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Stats strip */}
            <div className="dueno-stats">
              <div className="dueno-stat-card">
                <span className="admin-stat-label">My Pets</span>
                <strong>{pets.length}</strong>
              </div>
              <div className="dueno-stat-card">
                <span className="admin-stat-label">Upcoming</span>
                <strong>{reminders.length}</strong>
              </div>
              <div className={`dueno-stat-card ${overdueCount > 0 ? 'admin-stat-card--accent' : ''}`}>
                <span className="admin-stat-label">Overdue</span>
                <strong>{overdueCount}</strong>
              </div>
            </div>
          </div>

          {/* Right: Appointments / reminders */}
          <div className="dueno-right">
            <div className="dueno-section-head">
              <h3>Upcoming Appointments</h3>
              <Link to="/recordatorios" className="btn-text" style={{ fontSize: '0.82rem' }}>View all →</Link>
            </div>

            {reminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8, color: 'var(--color-border)' }}>calendar_today</span>
                <p>No upcoming appointments.</p>
                <Link to="/solicitar-cita" className="btn-primary" style={{ marginTop: 12 }}>Request one now</Link>
              </div>
            ) : (
              <div className="dueno-reminders">
                {reminders.map(r => (
                  <div key={r.id} className="dueno-reminder-card">
                    <div className="dueno-reminder-card__icon-wrap">
                      <span className="material-symbols-rounded dueno-reminder-card__icon">{TYPE_ICON[r.type] ?? 'event'}</span>
                    </div>
                    <div className="dueno-reminder-card__info">
                      <div className="dueno-reminder-card__row">
                        <strong>{r.title}</strong>
                        <span className={`clinical-status ${statusClass[r.status] ?? ''}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      <span className="dueno-reminder-card__meta">
                        {r.petName && <>{r.petName} · </>}
                        {new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {r.message && <p className="dueno-reminder-card__msg">{r.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="dueno-quick-actions">
              <Link to="/marketplace" className="dueno-quick-btn">
                <span className="material-symbols-rounded">storefront</span>
                Shop for my pet
              </Link>
              <Link to="/perfil" className="dueno-quick-btn">
                <span className="material-symbols-rounded">person</span>
                My profile
              </Link>
              <Link to="/solicitar-cita" className="dueno-quick-btn dueno-quick-btn--primary">
                <span className="material-symbols-rounded">home_health</span>
                Vet at home
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
