import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { PetForm } from '../components/PetForm';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Pet, PetInput } from '../types/pet';

export function PetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isEdit = Boolean(id);

  useEffect(() => {
    if (!hasRole('VETERINARIO', 'ADMIN')) {
      navigate('/sin-permiso');
    }
  }, [hasRole, navigate]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) return;
    petsApi
      .getPet(id)
      .then((res) => setPet(res.pet))
      .catch((err) => setLoadError(getAuthErrorMessage(err)));
  }, [id]);

  async function handleSubmit(data: PetInput) {
    if (isEdit && id) {
      await petsApi.updatePet(id, data);
      navigate(`/mascotas/${id}`);
    } else {
      const res = await petsApi.createPet(data);
      navigate(`/mascotas/${res.pet.id}`);
    }
  }

  if (loadError) {
    return (
      <AppShell title="Mascota">
        <p className="auth-error">{loadError}</p>
        <Link to="/mascotas">← Volver</Link>
      </AppShell>
    );
  }

  if (isEdit && !pet) {
    return (
      <AppShell title="Editar mascota">
        <p>Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={isEdit ? 'Editar mascota' : 'Registrar mascota'}>
      <Link to={isEdit ? `/mascotas/${id}` : '/mascotas'} className="back-link">
        ← Volver
      </Link>
      <PetForm
        initial={pet ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={isEdit ? 'Guardar cambios' : 'Registrar mascota'}
      />
    </AppShell>
  );
}
