# ADR-002: Estructura Interna del Repositorio

| Campo | Valor |
|-------|-------|
| **ID** | ADR-002 |
| **Estado** | Aprobado |
| **Fecha** | 2026 |
| **Autoras** | Manuela Escobar Hernández · Sara Corrales Jaramillo |

## Contexto

El sistema está compuesto por múltiples servicios independientes. El repositorio debe reflejar la arquitectura, facilitar colaboración y CI/CD.

## Decisión

Se adopta un **Monorepo** con separación explícita por microservicio bajo `/services/`, más directorios compartidos.

```
vetcare-system/
├── services/
│   ├── user-management/
│   ├── clinical-history/
│   ├── tracking-reminders/
│   ├── storage-service/
│   ├── query-visualization/
│   └── notification-service/
├── infrastructure/
├── shared/
│   └── contracts/
├── docs/
└── README.md
```

## Buenas prácticas

- README por servicio con puertos, variables de entorno y endpoints.
- Directorios en **kebab-case**.
- ADRs en `/docs/`.
- Infrastructure as Code en `/infrastructure/`.
- Contratos OpenAPI en `/shared/contracts/`.
- `.gitignore` global en la raíz.

## Alternativas descartadas

- **Polyrepo:** overhead de coordinación para equipo pequeño.
- **Monorepo plano:** mezcla servicios sin claridad arquitectónica.
- **Separación por capa técnica:** rompe cohesión e independencia de despliegue.

## Relación con otros ADRs

- **ADR-001:** cada carpeta en `services/` corresponde a un microservicio.
- **ADR-003:** contratos en `shared/contracts/<nombre-servicio>/`.
