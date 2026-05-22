# user-management

Administración de usuarios, autenticación JWT y RBAC (veterinario, dueño, administrador).

## Puerto

`3001` (variable `PORT`)

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto HTTP | `3001` |
| `JWT_SECRET` | Secreto para firmar tokens | *(Fase 1)* |

## Endpoints (contrato)

Ver `shared/contracts/user-management/openapi.yaml`

- `POST /api/v1/auth`
- `GET /api/v1/users/{id}`
- `GET /health`

## Desarrollo local

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t vetcare-user-management .
docker run -p 3001:3001 vetcare-user-management
```
