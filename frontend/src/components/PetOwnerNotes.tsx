import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { OwnerNotes, Pet } from '../types/pet';

const emptyNotes: OwnerNotes = { habits: '', feeding: '', symptoms: '' };

interface PetOwnerNotesProps {
  pet: Pet;
  onUpdated: (pet: Pet) => void;
}

export function PetOwnerNotes({ pet, onUpdated }: PetOwnerNotesProps) {
  const { hasRole } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const canEdit = hasRole('DUENO', 'ADMIN');
  const [notes, setNotes] = useState<OwnerNotes>(pet.ownerNotes ?? emptyNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNotes(pet.ownerNotes ?? emptyNotes);
  }, [pet]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await petsApi.updateOwnerNotes(pet.id, notes);
      onUpdated(res.pet);
      showSuccess('Información complementaria guardada');
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="notas-dueno" className="pet-owner-notes dashboard-panel">
      <h2>Información complementaria (dueño)</h2>
      <p className="admin-section-desc">
        Hábitos, alimentación y síntomas reportados por el dueño — datos opcionales según el
        proyecto VetCare (ADR-001).
      </p>

      {canEdit ? (
        <form className="clinical-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          <label>
            Hábitos
            <textarea
              value={notes.habits}
              onChange={(e) => setNotes({ ...notes, habits: e.target.value })}
              rows={2}
              placeholder="Ej. paseos, ejercicio, convivencia…"
            />
          </label>
          <label>
            Alimentación
            <textarea
              value={notes.feeding}
              onChange={(e) => setNotes({ ...notes, feeding: e.target.value })}
              rows={2}
              placeholder="Dieta, horarios, restricciones…"
            />
          </label>
          <label>
            Síntomas observados
            <textarea
              value={notes.symptoms}
              onChange={(e) => setNotes({ ...notes, symptoms: e.target.value })}
              rows={2}
              placeholder="Cambios de comportamiento, molestias…"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar notas del dueño'}
          </button>
        </form>
      ) : (
        <dl className="pet-owner-notes__readonly">
          <div>
            <dt>Hábitos</dt>
            <dd>{notes.habits || '—'}</dd>
          </div>
          <div>
            <dt>Alimentación</dt>
            <dd>{notes.feeding || '—'}</dd>
          </div>
          <div>
            <dt>Síntomas</dt>
            <dd>{notes.symptoms || '—'}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
