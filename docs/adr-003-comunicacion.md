# ADR-003: Estrategia de Comunicación (REST + OpenAPI)

| Campo | Valor |
|-------|-------|
| **ID** | ADR-003 |
| **Estado** | Aprobado |
| **Fecha** | 2026 |
| **Autoras** | Manuela Escobar Hernández · Sara Corrales Jaramillo |

## Contexto

Seis microservicios deben comunicarse entre sí y con clientes (web, móvil). Se requiere un mecanismo uniforme, comprensible y con contratos formales y versionados.

## Decisión

- **REST sobre HTTP** como protocolo único.
- **OpenAPI 3.0** en `/shared/contracts/<nombre-servicio>/openapi.yaml`.
- Comunicación **síncrona**; rutas versionadas `/api/v1/...`.
- Desarrollo **contract-first**: el contrato es la fuente de verdad.

## Endpoints por servicio

| Servicio | Rutas base |
|----------|------------|
| user-management | `POST /api/v1/auth`, `GET /api/v1/users/{id}` |
| clinical-history | `GET/POST /api/v1/patients/{id}/records` |
| tracking-reminders | `GET/POST /api/v1/reminders` |
| storage-service | `GET/PUT /api/v1/storage/{resource}` |
| query-visualization | `GET /api/v1/dashboard/{petId}` |
| notification-service | `POST /api/v1/notifications/send` |

## Buenas prácticas

- Códigos HTTP: 200, 201, 400, 401, 403, 404, 500.
- Timeouts máximos de **5 s** entre servicios.
- Validación de contratos en CI (Spectral).
- API Gateway centralizado para JWT, rate limiting y routing (fase posterior).

## Alternativas descartadas

GraphQL, gRPC, SOAP, mensajería asíncrona como estrategia principal, WebSockets — complejidad o inconsistencia no justificada para este alcance.

## Relación con otros ADRs

- **ADR-001:** define los seis productores de contratos.
- **ADR-002:** ubicación de contratos en `shared/contracts/`.
