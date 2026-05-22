# Shared

Recursos compartidos del monorepo VetCare.

## contracts/

Contratos **OpenAPI 3.0** por microservicio (contract-first, ADR-003):

| Servicio | Contrato |
|----------|----------|
| user-management | `contracts/user-management/openapi.yaml` |
| clinical-history | `contracts/clinical-history/openapi.yaml` |
| tracking-reminders | `contracts/tracking-reminders/openapi.yaml` |
| storage-service | `contracts/storage-service/openapi.yaml` |
| query-visualization | `contracts/query-visualization/openapi.yaml` |
| notification-service | `contracts/notification-service/openapi.yaml` |

La implementación en `services/` debe alinearse con estos archivos.
