# Infrastructure

Configuración de despliegue local y (en fases posteriores) Kubernetes y CI/CD.

## Docker Compose (Fase 0)

Desde la raíz del repositorio:

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Para detener:

```bash
docker compose -f infrastructure/docker-compose.yml down
```

## Servicios expuestos

| Servicio | URL health |
|----------|------------|
| user-management | http://localhost:3001/health |
| clinical-history | http://localhost:3002/health |
| tracking-reminders | http://localhost:3003/health |
| storage-service | http://localhost:3004/health |
| query-visualization | http://localhost:3005/health |
| notification-service | http://localhost:3006/health |

## Próximas fases

- PostgreSQL y Redis en este compose
- API Gateway (Nginx o Express)
- Manifiestos Kubernetes en `infrastructure/k8s/`
- GitHub Actions con validación Spectral de OpenAPI
