import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as authApi from '../services/authApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Pet } from '../types/pet';

const ROLE_LABELS: Record<string, string> = {
  DUENO: 'Dueño de mascota',
  VETERINARIO: 'Veterinario',
  ADMIN: 'Administrador',
};

export function ProfilePage() {
  const { user, login, token, sessionExpiresAt, logout, hasRole } = useAuth();
  const { showSuccess, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isOwner = hasRole('DUENO');
  const isVet = hasRole('VETERINARIO');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    setPetsLoading(true);
    petsApi
      .listPets()
      .then((res) => setPets(res.pets))
      .catch(() => setPets([]))
      .finally(() => setPetsLoading(false));
  }, [isOwner]);

  useEffect(() => {
    setFullName(user?.fullName || '');
  }, [user?.fullName]);

  async function handleProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { user: updated } = await authApi.updateProfile(fullName);
      if (token && sessionExpiresAt) {
        login(token, updated, sessionExpiresAt);
      }
      showSuccess('Perfil actualizado');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showSuccess('Contraseña cambiada. Inicia sesión de nuevo.');
      logout();
      navigate('/login');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <AppShell title="Mi perfil">
      <div className={`profile-page ${isOwner ? 'profile-page--owner' : ''}`}>
        <p className="admin-section-desc">
          Rol: <strong>{ROLE_LABELS[user.role] || user.role}</strong> · {user.email}
        </p>
        {error && <p className="auth-error">{error}</p>}

        {isVet && (
          <section className="profile-owner-section dashboard-panel">
            <h2>Tu espacio como veterinario</h2>
            <p className="admin-section-desc">
              Gestiona historial clínico, recordatorios y pacientes. El dueño complementa hábitos y
              confirma citas.
            </p>
            <div className="profile-quick-links">
              <Link to="/panel/veterinario" className="btn-primary">
                Panel veterinario
              </Link>
              <Link to="/mascotas" className="btn-outline">
                Mascotas
              </Link>
              <Link to="/recordatorios" className="btn-outline">
                Recordatorios
              </Link>
              <Link to="/inicio" className="btn-outline">
                Dashboard analítico
              </Link>
            </div>
            <div className="profile-notif-hint">
              <span className="profile-notif-hint__icon" aria-hidden>
                🔔
              </span>
              <div>
                <strong>Notificaciones ({unreadCount} sin leer)</strong>
                <p>
                  Alertas IN_APP cuando hay controles vencidos (ej. paciente Luna). Revisa la campana
                  del encabezado.
                </p>
              </div>
            </div>
          </section>
        )}

        {isOwner && (
          <section className="profile-owner-section dashboard-panel">
            <h2>Tu espacio como dueño (VetCare PDF)</h2>
            <p className="admin-section-desc">
              Consulta el historial clínico, confirma citas y complementa hábitos, alimentación y
              síntomas de tus mascotas.
            </p>

            <div className="profile-quick-links">
              <Link to="/panel/dueno" className="btn-primary">
                Panel dueño
              </Link>
              <Link to="/recordatorios" className="btn-outline">
                Recordatorios
              </Link>
              <Link to="/mascotas" className="btn-outline">
                Mis mascotas
              </Link>
            </div>

            <div className="profile-notif-hint">
              <span className="profile-notif-hint__icon" aria-hidden>
                🔔
              </span>
              <div>
                <strong>Notificaciones ({unreadCount} sin leer)</strong>
                <p>
                  Usa la campana del encabezado para ver alertas IN_APP, EMAIL y PUSH del demo
                  (notification-service).
                </p>
              </div>
            </div>

            <h3 className="profile-owner-section__subtitle">Mis mascotas</h3>
            {petsLoading && <p className="pet-loading">Cargando mascotas…</p>}
            {!petsLoading && pets.length === 0 && (
              <p className="admin-section-desc">Aún no tienes mascotas asignadas en el sistema.</p>
            )}
            {!petsLoading && pets.length > 0 && (
              <ul className="profile-pets-list">
                {pets.map((p) => (
                  <li key={p.id} className="profile-pet-row">
                    <div>
                      <strong>{p.name}</strong>
                      <span className="profile-pet-row__meta">
                        {p.species} · {p.breed}
                      </span>
                    </div>
                    <div className="profile-pet-row__actions">
                      <Link to={`/mascotas/${p.id}/historial`} className="btn-text">
                        Historial
                      </Link>
                      <Link to={`/mascotas/${p.id}#notas-dueno`} className="btn-text">
                        Notas dueño
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <form className="admin-user-form" onSubmit={handleProfile}>
          <h2>Datos básicos</h2>
          <label>
            Nombre completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            Guardar perfil
          </button>
        </form>

        <form className="admin-user-form" onSubmit={handlePassword}>
          <h2>Cambiar contraseña</h2>
          <label>
            Contraseña actual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button type="submit" className="btn-outline" disabled={saving}>
            Cambiar contraseña
          </button>
        </form>
      </div>
    </AppShell>
  );
}
