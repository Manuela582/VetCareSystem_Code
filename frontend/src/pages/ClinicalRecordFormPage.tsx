import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ClinicalRecordForm } from '../components/ClinicalRecordForm';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as clinicalApi from '../services/clinicalApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { ClinicalRecord, ClinicalRecordInput } from '../types/clinical';

export function ClinicalRecordFormPage() {
  const { id: petId, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showSuccess } = useNotifications();
  const isEdit = Boolean(recordId);

  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [error, setError] = useState('');

  /*
   * Escenario 2 (pantalla) — Al abrir el formulario de consulta.
   * Si no es veterinario ni admin, lo saca antes de mostrar campos de edición.
   * (El API también bloquea en POST/PUT si intentan forzar la petición.)
   */
  useEffect(() => {
    if (!hasRole('VETERINARIO', 'ADMIN')) {
      navigate('/sin-permiso'); // aviso visual: no tiene permiso para editar historial
    }
  }, [hasRole, navigate]);

  useEffect(() => {
    if (!isEdit || !petId || !recordId) return;
    clinicalApi
      .getRecord(petId, recordId)
      .then((res) => setRecord(res.record))
      .catch((err) => setError(getAuthErrorMessage(err)));
  }, [isEdit, petId, recordId]);

  /*
   * Escenario 4 (pantalla) — El veterinario guarda la consulta.
   * Paso 1: clinicalApi.createRecord → API valida y guarda.
   * Paso 2: showSuccess → confirma al usuario que quedó registrada (respuesta del PDF).
   */
  async function handleSubmit(data: ClinicalRecordInput) {
    if (!petId) return;
    if (isEdit && recordId) {
      await clinicalApi.updateRecord(petId, recordId, data);
      showSuccess('Consulta actualizada');
    } else {
      const res = await clinicalApi.createRecord(petId, data);
      const n = res.autoReminders?.length ?? 0;
      showSuccess(
        n > 0
          ? `Consulta registrada. ${n} recordatorio(s) generado(s) automáticamente.`
          : 'Consulta registrada',
      );
    }
    navigate(`/mascotas/${petId}/historial`);
  }

  if (error && isEdit && !record) {
    return (
      <AppShell title="Consulta médica">
        <p className="auth-error">{error}</p>
        <Link to={`/mascotas/${petId}/historial`}>← Volver</Link>
      </AppShell>
    );
  }

  if (isEdit && !record) {
    return (
      <AppShell title="Editar consulta">
        <p className="pet-loading">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={isEdit ? 'Editar consulta' : 'Nueva consulta'}>
      <div className="clinical-form-page">
        <Link to={`/mascotas/${petId}/historial`} className="back-link">
          ← Volver al historial
        </Link>
        <ClinicalRecordForm
          initial={record ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Guardar cambios' : 'Registrar consulta'}
        />
      </div>
    </AppShell>
  );
}
