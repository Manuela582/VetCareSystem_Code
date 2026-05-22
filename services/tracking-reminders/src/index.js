const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const SERVICE_NAME = 'tracking-reminders';
const PORT = Number(process.env.PORT) || 3003;
const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'vetcare-dev-secret-cambiar-en-produccion';
const CLINICAL_HISTORY_URL = process.env.CLINICAL_HISTORY_URL || 'http://localhost:3002';
const LUNA_PET_ID = '10000000-0000-4000-8000-000000000001';

const STATUSES = ['PENDIENTE', 'COMPLETADO', 'VENCIDO'];
const TYPES = ['VACUNA', 'CONTROL', 'TRATAMIENTO'];

/** @type {Map<string, object>} */
const remindersById = new Map();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido', code: 'TOKEN_INVALID' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({
      message: err.name === 'TokenExpiredError' ? 'Sesión expirada' : 'Token inválido',
      code: 'TOKEN_INVALID',
    });
  }
}

function resolveStatus(reminder) {
  if (reminder.status === 'COMPLETADO') return 'COMPLETADO';
  const due = new Date(reminder.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'VENCIDO';
  return 'PENDIENTE';
}

function toPublic(reminder) {
  return {
    ...reminder,
    status: resolveStatus(reminder),
    confirmed: Boolean(reminder.confirmed),
    confirmedAt: reminder.confirmedAt || null,
  };
}

async function getOwnerPetIds(authHeader) {
  try {
    const res = await fetch(`${CLINICAL_HISTORY_URL}${API_PREFIX}/pets`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set((data.pets || []).map((p) => p.id));
  } catch {
    return new Set();
  }
}

async function ownerCanAccessReminder(reminder, authHeader, userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'VETERINARIO') return true;
  if (userRole !== 'DUENO') return false;
  const petIds = await getOwnerPetIds(authHeader);
  return petIds.has(reminder.petId);
}

function seedReminders() {
  if (remindersById.size > 0) return;
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const past = new Date();
  past.setDate(past.getDate() - 3);
  const items = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      petId: LUNA_PET_ID,
      petName: 'Luna',
      type: 'VACUNA',
      title: 'Refuerzo antirrábica',
      dueDate: in7.toISOString().slice(0, 10),
      status: 'PENDIENTE',
      message: 'Vacuna anual pendiente',
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      petId: LUNA_PET_ID,
      petName: 'Luna',
      type: 'CONTROL',
      title: 'Control dermatología',
      dueDate: past.toISOString().slice(0, 10),
      status: 'PENDIENTE',
      message: 'Seguimiento tratamiento piel',
    },
  ];
  for (const r of items) remindersById.set(r.id, r);
}

const app = express();
app.use(cors());
app.use(express.json());
seedReminders();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, version: '0.2.0' });
});

app.get(`${API_PREFIX}/reminders`, authMiddleware, async (req, res) => {
  let list = [...remindersById.values()].map(toPublic);
  if (req.userRole === 'DUENO') {
    const petIds = await getOwnerPetIds(req.headers.authorization);
    list = list.filter((r) => petIds.has(r.petId));
  }
  if (req.query.petId) list = list.filter((r) => r.petId === req.query.petId);
  if (req.query.type) list = list.filter((r) => r.type === req.query.type);
  if (req.query.status) list = list.filter((r) => r.status === req.query.status);
  list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return res.json({ reminders: list });
});

app.post(`${API_PREFIX}/reminders`, authMiddleware, (req, res) => {
  if (req.userRole === 'DUENO') {
    return res.status(403).json({
      message: 'Solo veterinarios pueden crear recordatorios clínicos',
      code: 'FORBIDDEN',
    });
  }
  const { petId, petName, type, title, dueDate, message } = req.body || {};
  if (!petId || !type || !title || !dueDate) {
    return res.status(400).json({ message: 'Mascota, tipo, título y fecha son obligatorios' });
  }
  if (!TYPES.includes(type)) return res.status(400).json({ message: 'Tipo no válido' });

  const reminder = {
    id: randomUUID(),
    petId,
    petName: petName || 'Mascota',
    type,
    title: String(title).trim(),
    dueDate: String(dueDate).slice(0, 10),
    status: 'PENDIENTE',
    message: message?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  remindersById.set(reminder.id, reminder);
  return res.status(201).json({ reminder: toPublic(reminder) });
});

app.put(`${API_PREFIX}/reminders/:id`, authMiddleware, (req, res) => {
  const reminder = remindersById.get(req.params.id);
  if (!reminder) return res.status(404).json({ message: 'Recordatorio no encontrado' });

  if (req.body.title) reminder.title = String(req.body.title).trim();
  if (req.body.dueDate) reminder.dueDate = String(req.body.dueDate).slice(0, 10);
  if (req.body.message !== undefined) reminder.message = String(req.body.message).trim();
  if (req.body.type && TYPES.includes(req.body.type)) reminder.type = req.body.type;
  if (req.body.status && STATUSES.includes(req.body.status)) reminder.status = req.body.status;

  return res.json({ reminder: toPublic(reminder) });
});

app.patch(`${API_PREFIX}/reminders/:id/complete`, authMiddleware, (req, res) => {
  if (req.userRole === 'DUENO') {
    return res.status(403).json({
      message: 'Los dueños pueden confirmar asistencia, no marcar como completado clínico',
      code: 'FORBIDDEN',
    });
  }
  const reminder = remindersById.get(req.params.id);
  if (!reminder) return res.status(404).json({ message: 'Recordatorio no encontrado' });
  reminder.status = 'COMPLETADO';
  return res.json({ reminder: toPublic(reminder) });
});

app.patch(`${API_PREFIX}/reminders/:id/confirm`, authMiddleware, async (req, res) => {
  const reminder = remindersById.get(req.params.id);
  if (!reminder) return res.status(404).json({ message: 'Recordatorio no encontrado' });
  if (resolveStatus(reminder) === 'COMPLETADO') {
    return res.status(400).json({ message: 'El recordatorio ya está completado' });
  }
  const allowed = await ownerCanAccessReminder(
    reminder,
    req.headers.authorization,
    req.userId,
    req.userRole,
  );
  if (!allowed) {
    return res.status(403).json({
      message: 'No puedes confirmar citas de mascotas que no te pertenecen',
      code: 'FORBIDDEN',
    });
  }
  reminder.confirmed = true;
  reminder.confirmedAt = new Date().toISOString();
  return res.json({ reminder: toPublic(reminder) });
});

app.delete(`${API_PREFIX}/reminders/:id`, authMiddleware, (req, res) => {
  if (!remindersById.has(req.params.id)) {
    return res.status(404).json({ message: 'Recordatorio no encontrado' });
  }
  remindersById.delete(req.params.id);
  return res.json({ message: 'Recordatorio eliminado' });
});

app.listen(PORT, () => console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`));
