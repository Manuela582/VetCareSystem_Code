import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as remindersApi from '../services/remindersApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { Reminder, ReminderInput, ReminderStatus, ReminderType } from '../types/reminder';
import type { Pet } from '../types/pet';

const STATUS_LABELS: Record<ReminderStatus, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  VENCIDO: 'Vencido',
};

const TYPE_LABELS: Record<ReminderType, string> = {
  VACUNA: 'Vacuna',
  CONTROL: 'Control',
  TRATAMIENTO: 'Tratamiento',
};

const statusClass: Record<ReminderStatus, string> = {
  PENDIENTE: 'status--activa',
  COMPLETADO: 'status--cerrada',
  VENCIDO: 'status--urgente',
};

export function RemindersPage() {
  const { hasRole } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const canManage = hasRole('VETERINARIO', 'ADMIN');
  const isOwner = hasRole('DUENO');

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReminderStatus | ''>('');
  const [filterType, setFilterType] = useState<ReminderType | ''>('');
  const [filterPetId, setFilterPetId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ReminderInput>({
    petId: '',
    type: 'VACUNA',
    title: '',
    dueDate: '',
    message: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        remindersApi.listReminders({
          status: filterStatus || undefined,
          type: filterType || undefined,
          petId: filterPetId || undefined,
        }),
        petsApi.listPets(),
      ]);
      setReminders(r.reminders);
      setPets(p.pets);
    } catch (e) {
      showError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterStatus, filterType, filterPetId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const pet = pets.find((p) => p.id === form.petId);
    try {
      await remindersApi.createReminder({
        ...form,
        petName: pet?.name,
      });
      showSuccess('Recordatorio creado');
      setModalOpen(false);
      setForm({ petId: '', type: 'VACUNA', title: '', dueDate: '', message: '' });
      await load();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function handleComplete(id: string) {
    try {
      await remindersApi.completeReminder(id);
      showSuccess('Marcado como completado');
      await load();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function handleConfirm(id: string) {
    try {
      await remindersApi.confirmReminder(id);
      showSuccess('Asistencia confirmada');
      await load();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este recordatorio?')) return;
    try {
      await remindersApi.deleteReminder(id);
      showSuccess('Recordatorio eliminado');
      await load();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  return (
    <AppLayout title="Recordatorios y alertas">
      {isOwner && (
        <p className="dueno-readonly-banner" role="note">
          Como dueño puedes <strong>confirmar asistencia</strong> a citas. La creación y cierre
          clínico de recordatorios corresponde al veterinario (o se generan automáticamente al
          registrar consultas).
        </p>
      )}

      <div className="reminders-toolbar">
        <div className="reminders-toolbar__filters">
          <select
            className="app-select"
            value={filterPetId}
            onChange={(e) => setFilterPetId(e.target.value)}
            aria-label="Filtrar por mascota"
          >
            <option value="">Todas las mascotas</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="app-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ReminderType | '')}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            <option value="VACUNA">Vacunas pendientes</option>
            <option value="CONTROL">Controles periódicos</option>
            <option value="TRATAMIENTO">Tratamientos</option>
          </select>
          <select
            className="app-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReminderStatus | '')}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="VENCIDO">Vencido</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn-primary reminders-toolbar__btn"
            onClick={() => setModalOpen(true)}
          >
            + Crear recordatorio
          </button>
        )}
      </div>

      {loading && (
        <div className="reminders-skeleton">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <EmptyState
          title="No hay recordatorios"
          description={
            canManage
              ? 'Crea alertas o registra una consulta con vacunas/seguimiento para generarlas automáticamente.'
              : 'Cuando el veterinario programe citas, aparecerán aquí.'
          }
          action={
            canManage ? (
              <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
                Crear recordatorio
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && reminders.length > 0 && (
        <ul className="reminders-list">
          {reminders.map((r) => (
            <li key={r.id} className={`reminder-card reminder-card--${r.status.toLowerCase()}`}>
              <div className="reminder-card__head">
                <span className={`clinical-status ${statusClass[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
                <span className="reminder-card__type">{TYPE_LABELS[r.type]}</span>
              </div>
              <h3>
                <Link to={`/mascotas/${r.petId}/historial`}>{r.title}</Link>
              </h3>
              <p>
                <Link to={`/mascotas/${r.petId}`}>
                  <strong>{r.petName}</strong>
                </Link>
                {' · '}
                {r.dueDate}
              </p>
              {r.message && <p className="reminder-card__msg">{r.message}</p>}
              {canManage && r.confirmed && r.status !== 'COMPLETADO' && (
                <span className="dueno-confirmed-label dueno-confirmed-label--card">
                  ✓ Dueño confirmó asistencia
                  {r.confirmedAt &&
                    ` · ${new Date(r.confirmedAt).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}`}
                </span>
              )}
              <div className="reminder-card__actions">
                <Link to={`/mascotas/${r.petId}/historial`} className="btn-text">
                  Ver historial
                </Link>
                {canManage && (
                  <Link
                    to={`/mascotas/${r.petId}/historial/nueva`}
                    className="btn-text"
                  >
                    Nueva consulta
                  </Link>
                )}
              </div>
              {canManage && r.status !== 'COMPLETADO' && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => handleComplete(r.id)}
                >
                  Marcar completado
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  className="btn-text reminder-card__delete"
                  onClick={() => handleDelete(r.id)}
                >
                  Eliminar
                </button>
              )}
              {isOwner && r.status !== 'COMPLETADO' && !r.confirmed && (
                <button
                  type="button"
                  className="btn-outline dueno-confirm-btn"
                  onClick={() => handleConfirm(r.id)}
                >
                  Confirmar asistencia
                </button>
              )}
              {r.confirmed && r.status !== 'COMPLETADO' && (
                <span className="dueno-confirmed-label dueno-confirmed-label--card">
                  ✓ Asistencia confirmada
                  {r.confirmedAt &&
                    ` · ${new Date(r.confirmedAt).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <Modal open={modalOpen} title="Nuevo recordatorio" onClose={() => setModalOpen(false)}>
          <form className="clinical-form" onSubmit={handleCreate}>
            <label>
              Mascota *
              <select
                className="app-select"
                value={form.petId}
                onChange={(e) => setForm({ ...form, petId: e.target.value })}
                required
              >
                <option value="">Seleccionar</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo *
              <select
                className="app-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType })}
              >
                <option value="VACUNA">Vacuna</option>
                <option value="CONTROL">Control periódico</option>
                <option value="TRATAMIENTO">Tratamiento</option>
              </select>
            </label>
            <label>
              Título *
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Fecha *
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </label>
            <label>
              Mensaje
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={2}
              />
            </label>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
