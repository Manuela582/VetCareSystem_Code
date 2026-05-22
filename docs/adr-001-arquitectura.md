# ADR-001: Selección de Estilo Arquitectónico

| Campo | Valor |
|-------|-------|
| **ID** | ADR-001 |
| **Estado** | Aprobado |
| **Fecha** | 2026 |
| **Autoras** | Manuela Escobar Hernández · Sara Corrales Jaramillo |

## Contexto

En Colombia, entre el 60 % y el 67 % de los hogares tienen al menos una mascota. Muchas clínicas operan con sistemas aislados o registros no estandarizados. Se requiere un sistema centralizado que gestione información clínica de forma segura, escalable y observable.

## Decisión

Se adopta el estilo **Microservicios** para VetCare System: seis servicios independientes, despliegue autónomo y comunicación mediante APIs REST.

| Microservicio | Responsabilidad |
|---------------|-----------------|
| `user-management` | Usuarios, autenticación JWT, RBAC |
| `clinical-history` | Consultas, diagnósticos, tratamientos, vacunas |
| `tracking-reminders` | Alertas preventivas y seguimiento |
| `storage-service` | Persistencia centralizada, respaldo y recuperación |
| `query-visualization` | Consultas agregadas y dashboard |
| `notification-service` | Alertas multicanal (email, push) |

## Alternativas descartadas

- **Monolito:** escalado y despliegue acoplados.
- **N-Tier:** no permite escalado granular por componente.
- **SOA / ESB:** punto único de fallo y latencia extra.
- **Serverless:** cold start y estado difícil para historial clínico.

## Consecuencias

**Positivas:** escalado independiente, tolerancia a fallos, RBAC por servicio, CI/CD por servicio.

**Riesgos y mitigación:**

| Riesgo | Mitigación |
|--------|------------|
| Complejidad operacional | Prometheus, Grafana, Jaeger, API Gateway |
| Latencia entre servicios | Timeouts 5 s, máximo 2 saltos síncronos |
| Consistencia eventual | Sagas y versionado de APIs |
| Overhead de infra | Docker + Kubernetes |

## Referencias

- Fowler, M. (2014). [Microservices](https://martinfowler.com/articles/microservices.html)
- Newman, S. (2015). *Building Microservices*. O'Reilly.
