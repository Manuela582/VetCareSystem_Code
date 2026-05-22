# clinical-history

Registro y consulta de consultas médicas, diagnósticos, tratamientos y vacunas.

## Puerto

`3002`

## Contrato

`shared/contracts/clinical-history/openapi.yaml`

- `GET /api/v1/patients/{petId}/records`
- `POST /api/v1/patients/{petId}/records`
- `GET /health`

## Desarrollo local

```bash
npm install && npm run dev
```
