import { AppShell } from '../components/AppShell';

const SERVICES = [
  { name: 'user-management', port: 3001, contract: 'user-management' },
  { name: 'clinical-history', port: 3002, contract: 'clinical-history' },
  { name: 'tracking-reminders', port: 3003, contract: 'tracking-reminders' },
  { name: 'storage-service', port: 3004, contract: 'storage-service' },
  { name: 'query-visualization', port: 3005, contract: 'query-visualization' },
  { name: 'notification-service', port: 3006, contract: 'notification-service' },
];

const REPO =
  'https://github.com/Manuela582/VetCareSystem_Code/tree/main/shared/contracts';

export function ApiDocsPage() {
  return (
    <AppShell title="Documentación API (OpenAPI)">
      <p className="admin-section-desc">
        Contratos OpenAPI 3.0 en <code>/shared/contracts/</code> — Contract-First (ADR-003). En
        desarrollo, el proxy de Vite enruta <code>/api/v1/*</code> a cada microservicio.
      </p>

      <section className="admin-section">
        <h2>Health checks</h2>
        <ul className="api-docs-list">
          {SERVICES.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>
              <a href={`http://localhost:${s.port}/health`} target="_blank" rel="noreferrer">
                http://localhost:{s.port}/health
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <h2>Contratos (fuente de verdad)</h2>
        <ul className="api-docs-list">
          {SERVICES.map((s) => (
            <li key={s.contract}>
              <strong>{s.contract}</strong>
              <a
                href={`${REPO}/${s.contract}/openapi.yaml`}
                target="_blank"
                rel="noreferrer"
              >
                openapi.yaml en GitHub
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="admin-hint">
        Swagger UI / Redoc se generan desde estos YAML en CI. Para la demo académica, abre los
        archivos en el repositorio o usa Postman importando el contrato.
      </p>
    </AppShell>
  );
}
