import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
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

  const isDueno = hasRole('DUENO');
  const canManage = hasRole('VETERINARIO', 'ADMIN');

  // Dueños solo pueden crear, no editar mascotas ajenas
  if (!canManage && !(isDueno && !isEdit)) {
    return (
      <AppLayout title="Sin acceso">
        <p className="auth-error">No tienes permiso para editar esta mascota.</p>
        <Link to="/panel/dueno" className="back-link">← Volver a mi panel</Link>
      </AppLayout>
    );
  }

  return <PetFormInner id={id} isEdit={isEdit} isDueno={isDueno} />;
}

function PetFormInner({ id, isEdit, isDueno }: { id?: string; isEdit: boolean; isDueno: boolean }) {
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!id) return;
    petsApi.getPet(id)
      .then(res => setPet(res.pet))
      .catch(err => setLoadError(getAuthErrorMessage(err)));
  }, [id]);

  async function handleSubmit(data: PetInput) {
    setSubmitError('');
    try {
      if (isEdit && id) {
        await petsApi.updatePet(id, data);
        navigate(`/mascotas/${id}`);
      } else {
        const res = await petsApi.createPet(data);
        const petId = res.pet?.id;
        if (petId) {
          navigate(isDueno ? `/panel/dueno` : `/mascotas/${petId}`);
        } else {
          // La mascota se creó pero no tenemos el ID; ir al panel
          navigate(isDueno ? '/panel/dueno' : '/mascotas');
        }
      }
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Error al guardar la mascota');
      setSubmitError(msg);
      throw err; // re-throw para que PetForm también pueda mostrarlo
    }
  }

  if (loadError) {
    return (
      <AppLayout title="Mascota">
        <p className="auth-error">{loadError}</p>
        <Link to={isDueno ? '/panel/dueno' : '/mascotas'} className="back-link">← Volver</Link>
      </AppLayout>
    );
  }

  if (isEdit && !pet) {
    return (
      <AppLayout title="Editar mascota">
        <p>Cargando…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEdit ? 'Edit Pet' : 'Add New Pet'}>
      <Link
        to={isEdit ? `/mascotas/${id}` : (isDueno ? '/panel/dueno' : '/mascotas')}
        className="back-link"
      >
        ← Back
      </Link>

      {submitError && <p className="auth-error" style={{ marginBottom: 16 }}>{submitError}</p>}

      <PetForm
        initial={pet ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={isEdit ? 'Save changes' : 'Register pet'}
      />
    </AppLayout>
  );
}
