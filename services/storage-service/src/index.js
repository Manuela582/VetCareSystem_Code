const express = require('express');
const cors = require('cors');

/*
 * ESCENARIO 3 — Disponibilidad del sistema ante fallo (PDF §3.2 Fiabilidad)
 * Situación: cae el servidor de almacenamiento en momento de alta demanda.
 * Respuesta esperada del PDF: activar nodo de respaldo y seguir operando (< 5 s).
 *
 * Dónde se cumple HOY en este servicio (demo):
 *   · GET /health .............. el sistema puede comprobar si storage está vivo
 *   · GET/PUT /storage/:resource  contrato preparado (Fase 2), aún no persiste archivos
 *
 * Aún NO implementado en código (decirlo en exposición):
 *   · réplica / nodo backup automático al detectar caída
 *   · conmutación en menos de 5 segundos
 *
 * Relacionado: user-management → checkServiceHealth marca storage "down" si no responde.
 */

const SERVICE_NAME = 'storage-service';
const PORT = Number(process.env.PORT) || 3004;
const API_PREFIX = '/api/v1';

const app = express();
app.use(cors());
app.use(express.json());

// Escenario 3 — señal de vida: otros servicios (p. ej. admin) preguntan si storage responde.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    version: '0.1.0',
    phase: 0,
  });
});

// Escenario 3 (futuro) — lectura de archivos clínicos; hoy responde 501 = aún no operativo.
app.get(`${API_PREFIX}/storage/:resource`, (_req, res) => {
  res.status(501).json({
    message: 'Endpoint pendiente — Fase 2',
    contract: 'shared/contracts/storage-service/openapi.yaml',
  });
});

// Escenario 3 (futuro) — guardado en almacenamiento; aquí iría la réplica/backup en producción.
app.put(`${API_PREFIX}/storage/:resource`, (_req, res) => {
  res.status(501).json({
    message: 'Endpoint pendiente — Fase 2',
    contract: 'shared/contracts/storage-service/openapi.yaml',
  });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`);
});
