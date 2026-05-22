import { Link } from 'react-router-dom';
import { ClinicalStatusBadge } from './ClinicalStatusBadge';
import type { ClinicalRecord } from '../types/clinical';

interface ClinicalTimelineProps {
  petId: string;
  records: ClinicalRecord[];
  canEdit: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ClinicalTimeline({ petId, records, canEdit }: ClinicalTimelineProps) {
  if (records.length === 0) {
    return <p className="clinical-empty">No hay registros clínicos con estos filtros.</p>;
  }

  return (
    <ol className="clinical-timeline">
      {records.map((r) => (
        <li key={r.id} className="clinical-timeline__item">
          <div className="clinical-timeline__dot" aria-hidden />
          <article className="clinical-timeline__card">
            <header className="clinical-timeline__header">
              <time dateTime={r.date}>{formatDate(r.date)}</time>
              <ClinicalStatusBadge status={r.status} />
            </header>
            <h3 className="clinical-timeline__title">{r.diagnosis}</h3>
            {r.treatment && (
              <p>
                <strong>Tratamiento:</strong> {r.treatment}
              </p>
            )}
            {r.vaccines.length > 0 && (
              <p>
                <strong>Vacunas:</strong> {r.vaccines.join(', ')}
              </p>
            )}
            {r.observations && (
              <p className="clinical-timeline__notes">
                <strong>Observaciones:</strong> {r.observations}
              </p>
            )}
            {canEdit && (
              <Link
                to={`/mascotas/${petId}/historial/${r.id}/editar`}
                className="clinical-timeline__edit"
              >
                Editar registro
              </Link>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}
