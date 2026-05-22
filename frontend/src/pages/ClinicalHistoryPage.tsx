import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ClinicalTimeline } from '../components/ClinicalTimeline';
import { ClinicalTable } from '../components/ClinicalTable';
import { useAuth } from '../context/AuthContext';
import * as petsApi from '../services/petsApi';
import * as clinicalApi from '../services/clinicalApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import { STATUS_LABELS } from '../utils/clinicalStatus';
import type { Pet } from '../types/pet';
import type { ClinicalRecord, ClinicalStatus } from '../types/clinical';

type ViewMode = 'timeline' | 'table';

export function ClinicalHistoryPage() {
  const { id: petId } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  /*
   * Escenario 2 (pantalla) — Oculta botones "nueva consulta" / editar si es dueño.
   * canEdit false = no muestra acciones de modificación (solo lectura para dueño).
   */
  const canEdit = hasRole('VETERINARIO', 'ADMIN');

  const [pet, setPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('timeline');

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<ClinicalStatus | ''>('');

  const loadRecords = useCallback(() => {
    if (!petId) return;
    setLoading(true);
    clinicalApi
      .listRecords(petId, {
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        status: status || undefined,
      })
      .then((res) => {
        setRecords(res.records);
        setError('');
      })
      .catch((err) => setError(getAuthErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [petId, search, from, to, status]);

  useEffect(() => {
    if (!petId) return;
    petsApi.getPet(petId).then((res) => setPet(res.pet)).catch(() => {});
    loadRecords();
  }, [petId, loadRecords]);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    loadRecords();
  }

  function clearFilters() {
    setSearch('');
    setFrom('');
    setTo('');
    setStatus('');
  }

  return (
    <AppShell title="Historial clínico">
      <div className="clinical-page">
        <Link to={petId ? `/mascotas/${petId}` : '/mascotas'} className="back-link">
          ← Volver a la mascota
        </Link>

        {pet && (
          <div className="clinical-pet-banner">
            <h2>{pet.name}</h2>
            <p>
              {pet.species} · {pet.breed} · Dueño: {pet.ownerName}
            </p>
          </div>
        )}

        <div className="clinical-toolbar">
          <form className="clinical-filters" onSubmit={handleFilterSubmit}>
            <input
              type="search"
              placeholder="Buscar diagnóstico, tratamiento, vacunas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="clinical-filters__search"
            />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Desde" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Hasta" />
            <select value={status} onChange={(e) => setStatus(e.target.value as ClinicalStatus | '')}>
              <option value="">Todos los estados</option>
              {(Object.keys(STATUS_LABELS) as ClinicalStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-outline">
              Filtrar
            </button>
            <button type="button" className="btn-text" onClick={clearFilters}>
              Limpiar
            </button>
          </form>

          <div className="clinical-toolbar__actions">
            <div className="clinical-view-toggle">
              <button
                type="button"
                className={view === 'timeline' ? 'active' : ''}
                onClick={() => setView('timeline')}
              >
                Timeline
              </button>
              <button
                type="button"
                className={view === 'table' ? 'active' : ''}
                onClick={() => setView('table')}
              >
                Tabla
              </button>
            </div>
            {canEdit && petId && (
              <Link to={`/mascotas/${petId}/historial/nueva`} className="btn-primary">
                + Nueva consulta
              </Link>
            )}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="pet-loading">Cargando historial…</p>}

        {!loading && petId && view === 'timeline' && (
          <ClinicalTimeline petId={petId} records={records} canEdit={canEdit} />
        )}
        {!loading && petId && view === 'table' && (
          <ClinicalTable petId={petId} records={records} canEdit={canEdit} />
        )}

        {!canEdit && (
          <p className="clinical-readonly-hint">Modo consulta — solo lectura para dueños de mascota.</p>
        )}
      </div>
    </AppShell>
  );
}
