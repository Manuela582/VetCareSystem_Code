const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const SERVICE_NAME = 'notification-service';
const PORT = Number(process.env.PORT) || 3006;
const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'vetcare-dev-secret-cambiar-en-produccion';
const USER_MGMT_URL = process.env.USER_MGMT_URL || 'http://localhost:3001';
const VET_DEMO_ID = '00000000-0000-4000-8000-000000000001';
const ADMIN_DEMO_ID = '00000000-0000-4000-8000-000000000002';
const OWNER_DEMO_ID = '00000000-0000-4000-8000-000000000003';

/** @type {Map<string, object[]>} */
const notificationsByUser = new Map();

/** @type {object[]} historial global (admin) */
const broadcastHistory = [];

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
  } catch {
    return res.status(401).json({ message: 'Token inválido', code: 'TOKEN_INVALID' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Solo administradores', code: 'FORBIDDEN' });
  }
  next();
}

function getUserNotifications(userId) {
  if (!notificationsByUser.has(userId)) notificationsByUser.set(userId, []);
  return notificationsByUser.get(userId);
}

function pushNotification(userId, { subject, body, channel = 'IN_APP' }) {
  const notification = {
    id: randomUUID(),
    channel,
    subject,
    body,
    read: false,
    status: 'SENT',
    createdAt: new Date().toISOString(),
  };
  getUserNotifications(userId).unshift(notification);
  return notification;
}

function seedDemoNotifications() {
  if (getUserNotifications(OWNER_DEMO_ID).length > 0) return;

  pushNotification(OWNER_DEMO_ID, {
    subject: 'Recordatorio: Refuerzo antirrábica',
    body: 'Luna tiene vacuna programada en los próximos días. Revisa Recordatorios.',
    channel: 'IN_APP',
  });
  pushNotification(OWNER_DEMO_ID, {
    subject: 'Alerta por correo — Control dermatología',
    body: 'Se envió copia a dueno@vetcare.co con la fecha del control vencido.',
    channel: 'EMAIL',
  });
  pushNotification(OWNER_DEMO_ID, {
    subject: 'Notificación push — Seguimiento Luna',
    body: 'Activa las notificaciones push en la app móvil VetCare.',
    channel: 'PUSH',
  });

  pushNotification(VET_DEMO_ID, {
    subject: 'Paciente Luna — control pendiente',
    body: 'Hay un control de dermatología vencido. Revisa el panel veterinario.',
    channel: 'IN_APP',
  });
}

async function fetchAdminUsers(authHeader) {
  const res = await fetch(`${USER_MGMT_URL}${API_PREFIX}/admin/users`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) throw new Error('No se pudo obtener usuarios');
  const data = await res.json();
  return data.users || [];
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, version: '0.3.0' });
});

seedDemoNotifications();

app.post(`${API_PREFIX}/notifications/demo-notify`, authMiddleware, (req, res) => {
  const { userId, subject, body, channel } = req.body || {};
  if (!userId || !subject || !body) {
    return res.status(400).json({ message: 'userId, subject y body son obligatorios' });
  }
  if (req.userRole !== 'VETERINARIO' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'No autorizado', code: 'FORBIDDEN' });
  }
  const notification = pushNotification(userId, {
    subject,
    body,
    channel: channel || 'IN_APP',
  });
  return res.status(201).json({ notification });
});

app.get(`${API_PREFIX}/notifications`, authMiddleware, (req, res) => {
  const list = getUserNotifications(req.userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const unread = list.filter((n) => !n.read).length;
  return res.json({ notifications: list, unread });
});

app.patch(`${API_PREFIX}/notifications/:id/read`, authMiddleware, (req, res) => {
  const list = getUserNotifications(req.userId);
  const n = list.find((x) => x.id === req.params.id);
  if (!n) return res.status(404).json({ message: 'Notificación no encontrada' });
  n.read = true;
  return res.json({ notification: n });
});

app.patch(`${API_PREFIX}/notifications/read-all`, authMiddleware, (req, res) => {
  for (const n of getUserNotifications(req.userId)) n.read = true;
  return res.json({ message: 'Todas marcadas como leídas' });
});

app.post(`${API_PREFIX}/notifications/send`, authMiddleware, (req, res) => {
  const { channel, subject, body } = req.body || {};
  if (!subject || !body) {
    return res.status(400).json({ message: 'Asunto y mensaje son obligatorios' });
  }

  const notification = {
    id: randomUUID(),
    channel: channel || 'IN_APP',
    to: req.userId,
    subject,
    body,
    read: false,
    status: 'SENT',
    createdAt: new Date().toISOString(),
  };
  getUserNotifications(req.userId).unshift(notification);

  return res.status(201).json({
    id: notification.id,
    status: 'SENT',
    channel: notification.channel,
    message: 'Notificación registrada',
  });
});

app.post(`${API_PREFIX}/admin/notifications/broadcast`, authMiddleware, requireAdmin, async (req, res) => {
  const { subject, body, targetRole } = req.body || {};
  if (!subject || !body) {
    return res.status(400).json({ message: 'Asunto y mensaje son obligatorios' });
  }

  const allowedTargets = ['ALL', 'VETERINARIO', 'DUENO', 'ADMIN'];
  const target = allowedTargets.includes(targetRole) ? targetRole : 'ALL';

  try {
    const users = await fetchAdminUsers(req.headers.authorization);
    const recipients = users.filter(
      (u) => target === 'ALL' || u.role === target,
    );

    const broadcastId = randomUUID();
    const sentAt = new Date().toISOString();
    let sent = 0;

    for (const u of recipients) {
      getUserNotifications(u.id).unshift({
        id: randomUUID(),
        broadcastId,
        channel: 'BROADCAST',
        subject,
        body,
        read: false,
        status: 'SENT',
        createdAt: sentAt,
      });
      sent++;
    }

    const entry = {
      id: broadcastId,
      subject,
      body,
      targetRole: target,
      recipients: sent,
      status: 'SENT',
      sentAt,
      sentBy: req.userId,
    };
    broadcastHistory.unshift(entry);

    return res.status(201).json({ broadcast: entry });
  } catch (err) {
    const entry = {
      id: randomUUID(),
      subject,
      body,
      targetRole: target,
      recipients: 0,
      status: 'ERROR',
      sentAt: new Date().toISOString(),
      error: err.message,
    };
    broadcastHistory.unshift(entry);
    return res.status(502).json({ message: 'Error al enviar notificación global', broadcast: entry });
  }
});

app.get(`${API_PREFIX}/admin/notifications/history`, authMiddleware, requireAdmin, (_req, res) => {
  return res.json({ history: broadcastHistory.slice(0, 100) });
});

app.listen(PORT, () => console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`));
