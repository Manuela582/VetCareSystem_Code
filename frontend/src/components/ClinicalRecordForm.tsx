import { FormEvent, useEffect, useState } from 'react';
import type { ClinicalRecord, ClinicalRecordInput, ClinicalStatus } from '../types/clinical';

const STATUSES: ClinicalStatus[] = ['ACTIVA', 'SEGUIMIENTO', 'CERRADA', 'URGENTE'];

interface ClinicalRecordFormProps {
  initial?: ClinicalRecord;
  onSubmit: (data: ClinicalRecordInput) => Promise<void>;
  submitLabel: string;
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function ClinicalRecordForm({
  initial,
  onSubmit,
  submitLabel,
}: ClinicalRecordFormProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [vaccinesText, setVaccinesText] = useState('');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<ClinicalStatus>('ACTIVA');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setDate(toDateInputValue(initial.date));
    setDiagnosis(initial.diagnosis);
    setTreatment(initial.treatment);
    setVaccinesText(initial.vaccines.join(', '));
    setObservations(initial.observations);
    setStatus(initial.status);
  }, [initial]);

  // Escenario 4 — Recoge datos del formulario y los pasa a guardar (onSubmit → API).
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const vaccines = vaccinesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        date: new Date(date).toISOString(),
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        vaccines,
        observations: observations.trim(),
        status,
      });
    } catch (err) {
      // Esc.4: si el API rechaza datos (400) o falla, el veterinario ve el error aquí.
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="clinical-form" onSubmit={handleSubmit}>
      {error && <p className="auth-error">{error}</p>}

      <div className="clinical-form-row">
        <label>
          Fecha de consulta *
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          Estado *
          <select value={status} onChange={(e) => setStatus(e.target.value as ClinicalStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Diagnóstico *
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={2}
          required
          placeholder="Ej. Control rutinario, infección respiratoria…"
        />
      </label>

      <label>
        Tratamiento
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          rows={2}
          placeholder="Medicamentos, cuidados, dieta…"
        />
      </label>

      <label>
        Vacunas (separadas por coma)
        <input
          value={vaccinesText}
          onChange={(e) => setVaccinesText(e.target.value)}
          placeholder="Rabia, Polivalente, Triple felina…"
        />
      </label>

      <label>
        Observaciones
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={3}
          placeholder="Notas adicionales del veterinario…"
        />
      </label>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
