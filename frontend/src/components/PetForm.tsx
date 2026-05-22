import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as petsApi from '../services/petsApi';
import { readImageAsDataUrl } from '../utils/photo';
import type { OwnerOption, Pet, PetInput } from '../types/pet';

interface PetFormProps {
  initial?: Pet;
  onSubmit: (data: PetInput) => Promise<void>;
  submitLabel: string;
}

const emptyForm = {
  name: '',
  species: '',
  breed: '',
  age: '',
  weight: '',
  ownerId: '',
  photo: null as string | null,
};

export function PetForm({ initial, onSubmit, submitLabel }: PetFormProps) {
  const { user, hasRole } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showOwnerSelect = hasRole('VETERINARIO', 'ADMIN');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        species: initial.species,
        breed: initial.breed,
        age: String(initial.age),
        weight: String(initial.weight),
        ownerId: initial.ownerId,
        photo: initial.photo,
      });
    } else if (user?.role === 'DUENO') {
      setForm((f) => ({ ...f, ownerId: user.id }));
    }
  }, [initial, user]);

  useEffect(() => {
    if (!showOwnerSelect) return;
    petsApi
      .listOwners()
      .then((res) => setOwners(res.owners))
      .catch((err) => {
        setOwners([]);
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la lista de dueños. Reinicia user-management (npm run dev).',
        );
      });
  }, [showOwnerSelect]);

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error con la imagen');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const owner = owners.find((o) => o.id === form.ownerId);

    const payload: PetInput = {
      name: form.name.trim(),
      species: form.species.trim(),
      breed: form.breed.trim(),
      age: Number(form.age),
      weight: Number(form.weight),
      photo: form.photo,
      ownerId: form.ownerId || user?.id,
      ownerName: owner?.fullName || user?.fullName,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="pet-form" onSubmit={handleSubmit}>
      {error && <p className="auth-error">{error}</p>}

      <label>
        Nombre *
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </label>

      <div className="pet-form-row">
        <label>
          Especie *
          <input
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            placeholder="Perro, Gato…"
            required
          />
        </label>
        <label>
          Raza *
          <input
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            required
          />
        </label>
      </div>

      <div className="pet-form-row">
        <label>
          Edad (años) *
          <input
            type="number"
            min={0}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
          />
        </label>
        <label>
          Peso (kg) *
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            required
          />
        </label>
      </div>

      {showOwnerSelect && (
        <label>
          Dueño *
          <select
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            required
          >
            <option value="">Seleccionar dueño</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} ({o.email})
              </option>
            ))}
          </select>
        </label>
      )}

      {!showOwnerSelect && user && (
        <p className="pet-owner-hint">
          Dueño: <strong>{user.fullName}</strong> (tu cuenta)
        </p>
      )}

      <label>
        Foto de mascota
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoChange(e.target.files?.[0])}
        />
      </label>
      {form.photo && (
        <img src={form.photo} alt="Vista previa" className="pet-photo-preview" />
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
