import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as authApi from '../services/authApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Pet } from '../types/pet';

const ROLE_LABELS: Record<string, string> = {
  DUENO: 'Pet Owner',
  VETERINARIO: 'Veterinarian',
  ADMIN: 'Administrator',
};

function PetCard({ pet, onDeleted }: { pet: Pet; onDeleted: () => void }) {
  const { hasRole } = useAuth();
  const canEdit = hasRole('VETERINARIO', 'ADMIN');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${pet.name}?`)) return;
    setDeleting(true);
    try { await petsApi.deletePet(pet.id); onDeleted(); } finally { setDeleting(false); }
  }

  return (
    <div className="acc-pet-card">
      <div className="acc-pet-card__img">
        {pet.photo ? (
          <img src={pet.photo} alt={pet.name} className="acc-pet-card__photo" />
        ) : (
          <span className="material-symbols-rounded acc-pet-card__placeholder">pets</span>
        )}
        <span className="acc-pet-card__status-dot" />
      </div>

      <div className="acc-pet-card__body">
        <div className="acc-pet-card__header">
          <div>
            <h3 className="acc-pet-card__name">{pet.name}</h3>
            <p className="acc-pet-card__meta">{pet.species} {pet.breed && `· ${pet.breed}`} · {pet.age} yrs</p>
          </div>
          <div className="acc-pet-card__actions">
            {canEdit && (
              <Link to={`/mascotas/${pet.id}/editar`} className="acc-pet-icon-btn" title="Edit">
                <span className="material-symbols-rounded">edit</span>
              </Link>
            )}
            <button type="button" className="acc-pet-icon-btn acc-pet-icon-btn--danger" onClick={handleDelete} disabled={deleting} title="Delete">
              <span className="material-symbols-rounded">delete</span>
            </button>
          </div>
        </div>

        <div className="acc-pet-card__info">
          <div className="acc-pet-card__row">
            <span className="material-symbols-rounded acc-pet-card__row-icon">monitor_weight</span>
            <span className="acc-pet-card__row-label">Weight</span>
            <span className="acc-pet-card__row-value">{pet.weight} kg</span>
          </div>
          {pet.createdAt && (
            <div className="acc-pet-card__row">
              <span className="material-symbols-rounded acc-pet-card__row-icon">calendar_today</span>
              <span className="acc-pet-card__row-label">Registered</span>
              <span className="acc-pet-card__row-value" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {new Date(pet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          {pet.allergies && (
            <div className="acc-pet-card__row acc-pet-card__row--warn">
              <span className="material-symbols-rounded acc-pet-card__row-icon">warning</span>
              <span className="acc-pet-card__row-label">Allergies</span>
              <span className="acc-pet-card__row-value">{pet.allergies}</span>
            </div>
          )}
        </div>

        <Link to={`/mascotas/${pet.id}/historial`} className="acc-pet-card__history-btn">
          Full Medical History
        </Link>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, login, token, sessionExpiresAt, logout, hasRole } = useAuth();
  const { showSuccess } = useNotifications();
  const navigate = useNavigate();
  const isOwner = hasRole('DUENO');
  const isVet = hasRole('VETERINARIO');

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPets = useCallback(() => {
    if (!isOwner && !isVet) return;
    setPetsLoading(true);
    petsApi.listPets()
      .then(res => setPets(res.pets))
      .catch(() => setPets([]))
      .finally(() => setPetsLoading(false));
  }, [isOwner, isVet]);

  useEffect(() => { loadPets(); }, [loadPets]);
  useEffect(() => { setFullName(user?.fullName || ''); setPhone(user?.phone || ''); }, [user]);

  async function handleProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { user: updated } = await authApi.updateProfile(fullName);
      if (token && sessionExpiresAt) login(token, updated, sessionExpiresAt);
      showSuccess('Profile updated');
      setEditOpen(false);
    } catch (err) { setError(getAuthErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await authApi.changePassword(currentPw, newPw);
      showSuccess('Password changed. Please log in again.');
      logout(); navigate('/login');
    } catch (err) { setError(getAuthErrorMessage(err)); }
    finally { setSaving(false); }
  }

  if (!user) return null;

  const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <AppLayout title="Profile">
      {/* ── Header ── */}
      <div className="acc-header">
        <div>
          <h2 className="acc-header__title">Account Overview</h2>
          <p className="acc-header__sub">Manage your professional identity and household pet profiles.</p>
        </div>
        <div className="acc-header__actions">
          <button type="button" className="btn-outline acc-header-btn" onClick={() => { setEditOpen(v => !v); setPassOpen(false); }}>
            <span className="material-symbols-rounded">edit</span>
            Modify Information
          </button>
          <Link to="/mascotas/nueva" className="btn-primary acc-header-btn">
            <span className="material-symbols-rounded">add</span>
            Add Pet
          </Link>
        </div>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="acc-layout">
        {/* ── Left: profile card ── */}
        <aside className="acc-profile-card">
          <div className="acc-profile-card__avatar">{initials}</div>
          <h3 className="acc-profile-card__name">{user.fullName}</h3>
          <p className="acc-profile-card__role">{ROLE_LABELS[user.role] || user.role}</p>

          <div className="acc-profile-card__contacts">
            <div className="acc-profile-card__contact">
              <span className="material-symbols-rounded">mail</span>
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="acc-profile-card__contact">
                <span className="material-symbols-rounded">phone</span>
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          {(isVet || isOwner) && (
            <div className="acc-profile-card__stats">
              <div className="acc-profile-card__stat">
                <strong>{pets.length}</strong>
                <span>{isVet ? 'Patients' : 'My Pets'}</span>
              </div>
              <div className="acc-profile-card__stat">
                <strong>—</strong>
                <span>Avg Rating</span>
              </div>
            </div>
          )}

          {/* Edit form */}
          {editOpen && (
            <form className="acc-edit-form" onSubmit={handleProfile}>
              <label className="acc-edit-label">
                Full name
                <input className="reg-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </label>
              <div className="acc-edit-actions">
                <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 0, padding: '9px 16px', fontSize: '0.875rem' }}>
                  Save
                </button>
                <button type="button" className="btn-outline" onClick={() => setEditOpen(false)} style={{ padding: '9px 16px', fontSize: '0.875rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Password */}
          <button type="button" className="acc-pass-toggle" onClick={() => { setPassOpen(v => !v); setEditOpen(false); }}>
            <span className="material-symbols-rounded">lock</span>
            Change Password
          </button>

          {passOpen && (
            <form className="acc-edit-form" onSubmit={handlePassword}>
              <label className="acc-edit-label">
                Current password
                <input className="reg-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
              </label>
              <label className="acc-edit-label">
                New password
                <input className="reg-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={6} required />
              </label>
              <div className="acc-edit-actions">
                <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 0, padding: '9px 16px', fontSize: '0.875rem' }}>
                  Update
                </button>
                <button type="button" className="btn-outline" onClick={() => setPassOpen(false)} style={{ padding: '9px 16px', fontSize: '0.875rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </aside>

        {/* ── Right: pets grid ── */}
        <div className="acc-pets-section">
          <div className="acc-pets-header">
            <h3 className="acc-pets-header__title">Registered Pets</h3>
            <span className="acc-pets-header__count">
              Showing {pets.length} {isOwner ? 'Household' : ''} Pet{pets.length !== 1 ? 's' : ''}
            </span>
          </div>

          {petsLoading && (
            <div className="acc-pets-grid">
              {[1,2].map(i => <div key={i} className="acc-pet-card acc-pet-card--skeleton" />)}
            </div>
          )}

          {!petsLoading && (
            <div className="acc-pets-grid">
              {pets.map(p => (
                <PetCard key={p.id} pet={p} onDeleted={loadPets} />
              ))}

              {/* Add New Pet card */}
              <Link to="/mascotas/nueva" className="acc-add-pet-card">
                <span className="material-symbols-rounded acc-add-pet-card__icon">add_circle</span>
                <strong>Add New Pet</strong>
                <span>Expand your veterinary circle</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
