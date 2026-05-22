import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PetOwnerNotes } from '../components/PetOwnerNotes';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import * as dashboardApi from '../services/dashboardApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { PetDashboard } from '../types/dashboard';
import type { Pet } from '../types/pet';

const REMINDER_STATUS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  COMPLETADO: 'Completado',
};

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManagePet = hasRole('VETERINARIO', 'ADMIN');
  const isOwner = hasRole('DUENO');

  const [pet, setPet] = useState<Pet | null>(null);
  const [dash, setDash] = useState<PetDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([petsApi.getPet(id), dashboardApi.getPetDashboard(id)])
      .then(([petRes, dashRes]) => {
        setPet(petRes.pet);
        setDash(dashRes);
        setError('');
      })
      .catch((err) => setError(getAuthErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!pet || window.location.hash !== '#notas-dueno') return;
    const el = document.getElementById('notas-dueno');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pet]);

  async function handleDelete() {
    if (!id || !confirm('¿Eliminar esta mascota? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeleting(true);
    try {
      await petsApi.deletePet(id);
      navigate('/mascotas');
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setDeleting(false);
    }
  }

  if (error && !pet) {
    return (
      <AppShell title="Detalle de mascota">
        <p className="auth-error">{error}</p>
        <Link to="/mascotas" className="back-link">
          ← Volver al listado
        </Link>
      </AppShell>
    );
  }

  if (loading || !pet) {
    return (
      <AppShell title="Detalle de mascota">
        <p className="pet-loading">Cargando…</p>
      </AppShell>
    );
  }

  const records = dash?.records ?? [];
  const reminders = dash?.reminders ?? [];

  return (
    <AppShell title={`Mascota — ${pet.name}`}>
      <div className="pet-detail-page">
        <Link to="/mascotas" className="back-link">
          ← Volver al listado
        </Link>

        {isOwner && (
          <div className="dueno-readonly-banner pet-detail-owner-hint" role="note">
            <strong>Información complementaria (ADR-001):</strong> más abajo puedes editar hábitos,
            alimentación y síntomas de {pet.name}. El historial clínico es solo lectura.
            <a href="#notas-dueno" className="pet-detail-owner-hint__link">
              Ir a notas del dueño
            </a>
          </div>
        )}

        <article className="pet-detail-card">
          <div className="pet-detail-card__media">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} />
            ) : (
              <div className="pet-detail-card__placeholder" aria-hidden>
                <span className="material-symbols-rounded" style={{fontSize:'4rem',color:'var(--color-primary)',opacity:0.5}}>pets</span>
              </div>
            )}
          </div>

          <div className="pet-detail-card__body">
            <header className="pet-detail-card__header">
              <h2 className="pet-detail-card__name">{pet.name}</h2>
              <p className="pet-detail-card__subtitle">
                {pet.species} · {pet.breed}
              </p>
            </header>

            <dl className="pet-detail-card__info">
              <div className="pet-detail-card__field">
                <dt>Especie</dt>
                <dd>{pet.species}</dd>
              </div>
              <div className="pet-detail-card__field">
                <dt>Raza</dt>
                <dd>{pet.breed}</dd>
              </div>
              <div className="pet-detail-card__field">
                <dt>Edad</dt>
                <dd>{pet.age} años</dd>
              </div>
              <div className="pet-detail-card__field">
                <dt>Peso</dt>
                <dd>{pet.weight} kg</dd>
              </div>
              <div className="pet-detail-card__field pet-detail-card__field--full">
                <dt>Dueño</dt>
                <dd>{pet.ownerName}</dd>
              </div>
            </dl>

            <footer className="pet-detail-card__actions">
              <Link to={`/mascotas/${pet.id}/historial`} className="btn-primary">
                Historial clínico
              </Link>
              {canManagePet && (
                <>
                  <Link
                    to={`/mascotas/${pet.id}/historial/nueva`}
                    className="btn-primary"
                  >
                    + Nueva consulta
                  </Link>
                  <Link to={`/mascotas/${pet.id}/editar`} className="btn-outline">
                    Editar mascota
                  </Link>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Eliminando…' : 'Eliminar mascota'}
                  </button>
                </>
              )}
            </footer>
          </div>
        </article>

        <section className="pet-dashboard-summary dashboard-panel dashboard-panel--wide">
          <h2>Dashboard del historial (query-visualization)</h2>
          <div className="dashboard-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Consultas</span>
              <strong>{records.length}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Recordatorios</span>
              <strong>{reminders.length}</strong>
            </div>
            <div className="admin-stat-card admin-stat-card--warn">
              <span className="admin-stat-label">Pendientes</span>
              <strong>{reminders.filter((r) => r.status === 'PENDIENTE').length}</strong>
            </div>
          </div>

          <div className="pet-dashboard-grid">
            <div>
              <h3>Últimas consultas</h3>
              {records.length === 0 ? (
                <EmptyState title="Sin consultas" />
              ) : (
                <ul className="dashboard-list">
                  {records.slice(0, 4).map((r) => (
                    <li key={r.id}>
                      <strong>{r.diagnosis}</strong>
                      <span className="dashboard-list__meta">
                        {new Date(r.date).toLocaleDateString('es-CO')} · {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Recordatorios y alertas</h3>
              {reminders.length === 0 ? (
                <EmptyState title="Sin recordatorios" />
              ) : (
                <ul className="dashboard-list">
                  {reminders.slice(0, 4).map((r) => (
                    <li key={r.id}>
                      <strong>{r.title}</strong>
                      <span className="dashboard-list__meta">
                        {REMINDER_STATUS[r.status] || r.status} · {r.dueDate}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <PetOwnerNotes pet={pet} onUpdated={setPet} />
      </div>
    </AppShell>
  );
}
