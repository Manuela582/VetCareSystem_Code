import { STATUS_CLASS, STATUS_LABELS } from '../utils/clinicalStatus';
import type { ClinicalStatus } from '../types/clinical';

export function ClinicalStatusBadge({ status }: { status: ClinicalStatus }) {
  return (
    <span className={`clinical-status ${STATUS_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
