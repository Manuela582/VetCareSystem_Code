# VetCare System

Sistema de gestión clínica veterinaria basado en **microservicios**, monorepo y APIs REST documentadas con **OpenAPI 3.0**.

**Integrantes:** Sara Corrales Jaramillo · Manuela Escobar Hernández  
**Curso:** Arquitectura de Software — Medellín, 2026

## Estructura del repositorio

```
vetcare-system/
├── services/                 # Microservicios (Node.js + Express)
│   ├── user-management/
│   ├── clinical-history/
│   ├── tracking-reminders/
│   ├── storage-service/
│   ├── query-visualization/
│   └── notification-service/
├── shared/contracts/         # Contratos OpenAPI (contract-first)
├── infrastructure/           # Docker Compose, Kubernetes (fases posteriores)
└── docs/                     # Architecture Decision Records (ADRs)
```

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) y Docker Compose (recomendado para levantar todo el entorno)

## Inicio rápido — Login y frontend

Desde la **raíz** del repositorio:

```bash
npm run install:auth
npm run dev
```

Luego abre **http://localhost:3000** (usuario demo: `demo@vetcare.co` / `demo123`).

Levanta los 6 microservicios + frontend (puertos 3000–3006). Dashboard: **http://localhost:3000/inicio**

| Comando | Qué hace |
|---------|----------|
| `npm run install:auth` | Instala API + frontend |
| `npm run dev` | Levanta API (3001) y web (3000) a la vez |

### Solo API o solo frontend

```bash
npm run dev:user-management
npm run dev:frontend
```

## Docker Compose (microservicios, sin web)

```bash
cd infrastructure
docker compose up --build
```

### 3. Verificar salud de los servicios

| Servicio | Puerto | Health |
|----------|--------|--------|
| user-management | 3001 | http://localhost:3001/health |
| clinical-history | 3002 | http://localhost:3002/health |
| tracking-reminders | 3003 | http://localhost:3003/health |
| storage-service | 3004 | http://localhost:3004/health |
| query-visualization | 3005 | http://localhost:3005/health |
| notification-service | 3006 | http://localhost:3006/health |

### 4. Contratos OpenAPI

Los contratos viven en `shared/contracts/<nombre-servicio>/openapi.yaml` y son la fuente de verdad (ADR-003).

## Documentación arquitectónica

- [ADR-001 — Estilo arquitectónico (microservicios)](docs/adr-001-arquitectura.md)
- [ADR-002 — Estructura del repositorio (monorepo)](docs/adr-002-estructura-repo.md)
- [ADR-003 — Comunicación REST + OpenAPI](docs/adr-003-comunicacion.md)

## Frontend (React + TypeScript)

```bash
cd frontend && npm install && npm run dev
```

Pantallas: `/login`, `/registro`, `/recuperar-contrasena`, `/inicio` (logout).

Ver [frontend/README.md](frontend/README.md).

## Estado del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Estructura, ADRs, contratos OpenAPI, stubs `/health` | Listo |
| 1 | Auth JWT + frontend TypeScript | En curso |
| 2 | Recordatorios, dashboard, notificaciones | Pendiente |
| 3 | CI/CD, Kubernetes, observabilidad | Pendiente |

## Licencia

Proyecto académico — repositorio público para evaluación.
