const express = require('express');
const cors = require('cors');

const SERVICE_NAME = 'storage-service';
const PORT = Number(process.env.PORT) || 3004;
const API_PREFIX = '/api/v1';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    version: '0.1.0',
    phase: 0,
  });
});

app.get(`${API_PREFIX}/storage/:resource`, (_req, res) => {
  res.status(501).json({
    message: 'Endpoint pendiente — Fase 2',
    contract: 'shared/contracts/storage-service/openapi.yaml',
  });
});

app.put(`${API_PREFIX}/storage/:resource`, (_req, res) => {
  res.status(501).json({
    message: 'Endpoint pendiente — Fase 2',
    contract: 'shared/contracts/storage-service/openapi.yaml',
  });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`);
});
