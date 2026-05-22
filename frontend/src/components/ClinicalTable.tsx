import { Link } from 'react-router-dom';
import { ClinicalStatusBadge } from './ClinicalStatusBadge';
import type { ClinicalRecord } from '../types/clinical';

interface ClinicalTableProps {
  petId: string;
  records: ClinicalRecord[];
  canEdit: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO');
}

export function ClinicalTable({ petId, records, canEdit }: ClinicalTableProps) {
  if (records.length === 0) {
    return <p className="clinical-empty">No hay registros clínicos con estos filtros.</p>;
  }

  return (
    <div className="clinical-table-wrap">
      <table className="clinical-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Diagnóstico</th>
            <th>Tratamiento</th>
            <th>Vacunas</th>
            {canEdit && <th />}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.date)}</td>
              <td>
                <ClinicalStatusBadge status={r.status} />
              </td>
              <td>{r.diagnosis}</td>
              <td>{r.treatment || '—'}</td>
              <td>{r.vaccines.length ? r.vaccines.join(', ') : '—'}</td>
              {canEdit && (
                <td>
                  <Link to={`/mascotas/${petId}/historial/${r.id}/editar`}>Editar</Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
