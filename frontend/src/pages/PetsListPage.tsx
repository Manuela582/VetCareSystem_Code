import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Pet } from '../types/pet';

export function PetsListPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('VETERINARIO', 'ADMIN');
  const [pets, setPets] = useState<Pet[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vaccine, setVaccine] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await petsApi.listPets({
        search: search || undefined,
        vaccine: vaccine || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setPets(res.pets);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, vaccine, from, to]);

  useEffect(() => {
    const t = setTimeout(loadPets, 300);
    return () => clearTimeout(t);
  }, [loadPets]);

  return (
    <AppShell title={canEdit ? 'Mascotas' : 'Mis mascotas'}>
      <div className="pets-toolbar">
        <div className="pets-search-bar">
          <input
            type="search"
            placeholder="Buscar por nombre, dueño, especie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pets-search-input pets-search-input--search"
            aria-label="Buscar mascotas"
          />
          {canEdit && (
            <div className="pets-search-filters">
              <input
                type="text"
                placeholder="Vacuna"
                value={vaccine}
                onChange={(e) => setVaccine(e.target.value)}
                className="pets-search-input pets-search-input--vaccine"
                aria-label="Filtrar por vacuna"
              />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pets-search-input pets-search-input--date"
                title="Desde"
                aria-label="Fecha desde"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pets-search-input pets-search-input--date"
                title="Hasta"
                aria-label="Fecha hasta"
              />
            </div>
          )}
        </div>
        {canEdit && (
          <Link to="/mascotas/nueva" className="btn-primary pets-toolbar-btn">
            + Registrar mascota
          </Link>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Cargando mascotas…</p>}

      {!loading && !error && pets.length === 0 && (
        <div className="pets-empty-state">
          <p className="home-hint">No hay mascotas que coincidan con la búsqueda.</p>
          {canEdit && (
            <Link to="/mascotas/nueva" className="btn-primary">
              + Registrar primera mascota
            </Link>
          )}
        </div>
      )}

      <ul className="pets-grid">
        {pets.map((pet) => (
          <li key={pet.id} className="pet-card">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="pet-card-photo" />
            ) : (
              <div className="pet-card-placeholder">🐾</div>
            )}
            <div className="pet-card-body">
              <h3>{pet.name}</h3>
              <p>
                {pet.species} · {pet.breed}
              </p>
              <p className="pet-card-meta">
                {pet.age} años · {pet.weight} kg
              </p>
              {canEdit && <p className="pet-card-owner">Dueño: {pet.ownerName}</p>}
              <div className="pet-card-actions">
                <Link to={`/mascotas/${pet.id}`} className="pet-card-link">
                  Ver detalle →
                </Link>
                {canEdit && (
                  <>
                    <Link to={`/mascotas/${pet.id}/historial`} className="btn-text">
                      Historial
                    </Link>
                    <Link
                      to={`/mascotas/${pet.id}/historial/nueva`}
                      className="btn-outline pet-card-actions__cta"
                    >
                      + Consulta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
