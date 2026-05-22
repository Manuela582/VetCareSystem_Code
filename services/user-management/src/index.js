const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const SERVICE_NAME = 'user-management';
const PORT = Number(process.env.PORT) || 3001;
const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'vetcare-dev-secret-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/** @type {Map<string, object>} */
const usersByEmail = new Map();

/** @type {object[]} */
const failedLoginAttempts = [];

/** @type {object[]} */
const systemLogs = [];

/** @type {object[]} */
const systemErrors = [];

const OWNER_DEMO_ID = '00000000-0000-4000-8000-000000000003';
const MAX_LOG_ENTRIES = 200;

function pushLog(level, message, meta = {}) {
  systemLogs.unshift({
    id: randomUUID(),
    level,
    message,
    meta,
    at: new Date().toISOString(),
  });
  if (systemLogs.length > MAX_LOG_ENTRIES) systemLogs.length = MAX_LOG_ENTRIES;
}

function pushError(message, meta = {}) {
  systemErrors.unshift({
    id: randomUUID(),
    message,
    meta,
    at: new Date().toISOString(),
  });
  if (systemErrors.length > MAX_LOG_ENTRIES) systemErrors.length = MAX_LOG_ENTRIES;
}

function findUserById(id) {
  return [...usersByEmail.values()].find((u) => u.id === id);
}

function seedUsers() {
  const seeds = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'demo@vetcare.co',
      fullName: 'Usuario Demo',
      role: 'VETERINARIO',
      password: 'demo123',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      email: 'admin@vetcare.co',
      fullName: 'Administrador',
      role: 'ADMIN',
      password: 'admin123',
    },
    {
      id: OWNER_DEMO_ID,
      email: 'dueno@vetcare.co',
      fullName: 'Dueño Demo',
      role: 'DUENO',
      password: 'dueno123',
    },
  ];

  for (const s of seeds) {
    const email = s.email.toLowerCase();
    if (usersByEmail.has(email)) continue;
    usersByEmail.set(email, {
      id: s.id,
      email,
      fullName: s.fullName,
      role: s.role,
      passwordHash: bcrypt.hashSync(s.password, 10),
      active: true,
      blocked: false,
      sessionInvalidBefore: 0,
    });
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    active: user.active !== false,
    blocked: Boolean(user.blocked),
  };
}

function ensureUserFlags(user) {
  if (user.active === undefined) user.active = true;
  if (user.blocked === undefined) user.blocked = false;
  if (!user.sessionInvalidBefore) user.sessionInvalidBefore = 0;
}

function assertUserCanAuthenticate(user, res) {
  ensureUserFlags(user);
  if (user.blocked) {
    pushLog('warn', `Login bloqueado: ${user.email}`);
    res.status(403).json({
      message: 'Cuenta bloqueada por el administrador. Contacta soporte.',
      code: 'ACCOUNT_BLOCKED',
    });
    return false;
  }
  if (!user.active) {
    pushLog('warn', `Login cuenta inactiva: ${user.email}`);
    res.status(403).json({
      message: 'Cuenta desactivada. Contacta al administrador.',
      code: 'ACCOUNT_INACTIVE',
    });
    return false;
  }
  return true;
}

function buildAuthResponse(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
  const decoded = jwt.decode(token);
  return {
    token,
    user: toPublicUser(user),
    expiresAt: (decoded.exp || 0) * 1000,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token de autenticación requerido',
      code: 'TOKEN_INVALID',
    });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Sesión inválida', code: 'TOKEN_INVALID' });
    }
    ensureUserFlags(user);
    const issuedAtMs = (payload.iat || 0) * 1000;
    if (user.sessionInvalidBefore && issuedAtMs < user.sessionInvalidBefore) {
      return res.status(401).json({
        message: 'Tu sesión fue cerrada por el administrador. Inicia sesión de nuevo.',
        code: 'SESSION_REVOKED',
      });
    }
    if (user.blocked || !user.active) {
      return res.status(403).json({
        message: 'Tu cuenta no está disponible',
        code: user.blocked ? 'ACCOUNT_BLOCKED' : 'ACCOUNT_INACTIVE',
      });
    }
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Tu sesión ha expirado. Inicia sesión de nuevo.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      message: 'Token inválido o ausente',
      code: 'TOKEN_INVALID',
    });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: 'No tienes permiso para acceder a este recurso',
        code: 'FORBIDDEN',
      });
    }
    next();
  };
}

const app = express();
app.use(cors());
app.use(express.json());

seedUsers();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, version: '0.3.0' });
});

app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  const normalizedEmail = String(email).toLowerCase();
  const user = usersByEmail.get(normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    failedLoginAttempts.unshift({
      id: randomUUID(),
      email: normalizedEmail,
      at: new Date().toISOString(),
      reason: user ? 'WRONG_PASSWORD' : 'UNKNOWN_EMAIL',
    });
    if (failedLoginAttempts.length > MAX_LOG_ENTRIES) failedLoginAttempts.length = MAX_LOG_ENTRIES;
    pushLog('warn', `Intento de login fallido: ${normalizedEmail}`);
    return res.status(401).json({
      message: 'Credenciales incorrectas',
      code: 'UNAUTHORIZED',
    });
  }

  if (!assertUserCanAuthenticate(user, res)) return;

  pushLog('info', `Login exitoso: ${user.email}`, { userId: user.id, role: user.role });
  return res.json(buildAuthResponse(user));
});

app.post(`${API_PREFIX}/auth/register`, (req, res) => {
  const { fullName, email, password, role } = req.body || {};
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const normalizedEmail = String(email).toLowerCase();
  if (usersByEmail.has(normalizedEmail)) {
    return res.status(409).json({ message: 'Este correo ya está registrado' });
  }

  const allowedRoles = ['VETERINARIO', 'DUENO'];
  const userRole = allowedRoles.includes(role) ? role : 'DUENO';

  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    fullName: String(fullName).trim(),
    role: userRole,
    passwordHash: bcrypt.hashSync(password, 10),
    active: true,
    blocked: false,
    sessionInvalidBefore: 0,
  };
  usersByEmail.set(normalizedEmail, user);
  pushLog('info', `Usuario registrado: ${user.email}`, { userId: user.id });

  return res.status(201).json(buildAuthResponse(user));
});

app.post(`${API_PREFIX}/auth/forgot-password`, (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'El correo es obligatorio' });
  }

  return res.json({
    message:
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
  });
});

app.get(`${API_PREFIX}/auth/me`, authMiddleware, (req, res) => {
  const user = [...usersByEmail.values()].find((u) => u.id === req.userId);
  if (!user) {
    return res.status(401).json({
      message: 'Sesión inválida',
      code: 'TOKEN_INVALID',
    });
  }
  return res.json({ user: toPublicUser(user) });
});

/* /users/owners debe ir ANTES de /users/:id (sino Express toma "owners" como id) */
app.get(`${API_PREFIX}/users/owners`, authMiddleware, requireRoles('VETERINARIO', 'ADMIN'), (_req, res) => {
  const owners = [...usersByEmail.values()]
    .filter((u) => u.role === 'DUENO')
    .map(toPublicUser);
  return res.json({ owners });
});

app.get(`${API_PREFIX}/users/:id`, authMiddleware, (req, res) => {
  const user = [...usersByEmail.values()].find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  if (req.userId !== user.id && req.userRole !== 'ADMIN') {
    return res.status(403).json({
      message: 'No tienes permiso para ver este usuario',
      code: 'FORBIDDEN',
    });
  }
  return res.json(toPublicUser(user));
});

const MICROSERVICES = [
  { id: 'user-management', name: 'Gestión de usuarios', port: 3001, path: '/health' },
  { id: 'clinical-history', name: 'Historial clínico', port: 3002, path: '/health' },
  { id: 'tracking-reminders', name: 'Recordatorios', port: 3003, path: '/health' },
  { id: 'storage-service', name: 'Almacenamiento', port: 3004, path: '/health' },
  { id: 'query-visualization', name: 'Visualización', port: 3005, path: '/health' },
  { id: 'notification-service', name: 'Notificaciones', port: 3006, path: '/health' },
];

async function checkServiceHealth(svc) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`http://localhost:${svc.port}${svc.path}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ...svc, status: 'down', version: null };
    const data = await res.json();
    return { ...svc, status: 'ok', version: data.version || null };
  } catch {
    clearTimeout(timer);
    return { ...svc, status: 'down', version: null };
  }
}

async function fetchClinicalStats(authHeader) {
  try {
    const res = await fetch('http://localhost:3002/api/v1/admin/stats', {
      headers: authHeader ? { Authorization: authHeader } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    pushError('clinical-history stats no disponible', { error: String(err.message) });
    return null;
  }
}

async function fetchRemindersCount(authHeader) {
  try {
    const res = await fetch('http://localhost:3003/api/v1/reminders', {
      headers: authHeader ? { Authorization: authHeader } : {},
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data.reminders) ? data.reminders.length : 0;
  } catch {
    return 0;
  }
}

app.get(`${API_PREFIX}/admin/dashboard`, authMiddleware, requireRoles('ADMIN'), async (req, res) => {
  const users = [...usersByEmail.values()];
  const byRole = { VETERINARIO: 0, DUENO: 0, ADMIN: 0 };
  let activeUsers = 0;
  let blockedUsers = 0;
  for (const u of users) {
    ensureUserFlags(u);
    byRole[u.role] = (byRole[u.role] || 0) + 1;
    if (u.active) activeUsers++;
    if (u.blocked) blockedUsers++;
  }

  const clinical = await fetchClinicalStats(req.headers.authorization);
  const reminders = await fetchRemindersCount(req.headers.authorization);
  const services = await Promise.all(MICROSERVICES.map(checkServiceHealth));

  return res.json({
    users: {
      total: users.length,
      active: activeUsers,
      blocked: blockedUsers,
      byRole,
    },
    pets: clinical?.totalPets ?? 0,
    clinicalRecords: clinical?.totalRecords ?? 0,
    reminders,
    recordsByStatus: clinical?.recordsByStatus ?? {},
    services: services.map((s) => ({
      ...s,
      online: s.status === 'ok',
      health: s.status === 'ok' ? 'healthy' : 'unhealthy',
    })),
    security: {
      failedLogins24h: failedLoginAttempts.filter(
        (f) => Date.now() - new Date(f.at).getTime() < 86400000,
      ).length,
    },
    architecture: {
      style: 'Microservicios',
      communication: 'REST + OpenAPI 3.0',
      repository: 'Monorepo',
      qualityAttributes: ['Seguridad', 'Fiabilidad', 'Desempeño', 'Escalabilidad'],
    },
  });
});

app.get(`${API_PREFIX}/admin/users`, authMiddleware, requireRoles('ADMIN'), (_req, res) => {
  const users = [...usersByEmail.values()].map(toPublicUser);
  users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return res.json({ users });
});

app.post(`${API_PREFIX}/admin/users`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const { fullName, email, password, role } = req.body || {};
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }
  const normalizedEmail = String(email).toLowerCase();
  if (usersByEmail.has(normalizedEmail)) {
    return res.status(409).json({ message: 'Este correo ya está registrado' });
  }
  const allowedRoles = ['VETERINARIO', 'DUENO', 'ADMIN'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol no válido' });
  }
  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    fullName: String(fullName).trim(),
    role,
    passwordHash: bcrypt.hashSync(password, 10),
    active: true,
    blocked: false,
    sessionInvalidBefore: 0,
  };
  usersByEmail.set(normalizedEmail, user);
  pushLog('info', `Admin creó usuario: ${user.email}`, { adminId: req.userId });
  return res.status(201).json({ user: toPublicUser(user) });
});

app.put(`${API_PREFIX}/admin/users/:id`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const user = [...usersByEmail.values()].find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  if (req.body.fullName) user.fullName = String(req.body.fullName).trim();
  if (req.body.role) {
    const allowedRoles = ['VETERINARIO', 'DUENO', 'ADMIN'];
    if (!allowedRoles.includes(req.body.role)) {
      return res.status(400).json({ message: 'Rol no válido' });
    }
    if (user.id === req.userId && req.body.role !== 'ADMIN') {
      return res.status(400).json({ message: 'No puedes quitarte el rol de administrador' });
    }
    user.role = req.body.role;
  }
  if (req.body.password && String(req.body.password).length >= 6) {
    user.passwordHash = bcrypt.hashSync(req.body.password, 10);
  }

  return res.json({ user: toPublicUser(user) });
});

app.delete(`${API_PREFIX}/admin/users/:id`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
  }
  const entry = [...usersByEmail.entries()].find(([, u]) => u.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Usuario no encontrado' });
  usersByEmail.delete(entry[0]);
  pushLog('info', `Usuario eliminado: ${entry[1].email}`, { adminId: req.userId });
  return res.json({ message: 'Usuario eliminado' });
});

app.patch(`${API_PREFIX}/admin/users/:id/active`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (user.id === req.userId && req.body.active === false) {
    return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
  }
  user.active = req.body.active !== false;
  pushLog('info', `Usuario ${user.active ? 'activado' : 'desactivado'}: ${user.email}`);
  return res.json({ user: toPublicUser(user) });
});

app.patch(`${API_PREFIX}/admin/users/:id/block`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (user.id === req.userId) {
    return res.status(400).json({ message: 'No puedes bloquear tu propia cuenta' });
  }
  user.blocked = Boolean(req.body.blocked);
  if (user.blocked) {
    user.sessionInvalidBefore = Date.now();
    pushLog('warn', `Usuario bloqueado: ${user.email}`, { adminId: req.userId });
  } else {
    pushLog('info', `Usuario desbloqueado: ${user.email}`, { adminId: req.userId });
  }
  return res.json({ user: toPublicUser(user) });
});

app.post(`${API_PREFIX}/admin/users/:id/force-logout`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  user.sessionInvalidBefore = Date.now();
  pushLog('info', `Cierre de sesión forzado: ${user.email}`, { adminId: req.userId });
  return res.json({ message: 'Sesiones del usuario invalidadas' });
});

app.get(`${API_PREFIX}/admin/security/failed-logins`, authMiddleware, requireRoles('ADMIN'), (_req, res) => {
  return res.json({ attempts: failedLoginAttempts.slice(0, 100) });
});

app.get(`${API_PREFIX}/admin/observability/logs`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  return res.json({ logs: systemLogs.slice(0, limit) });
});

app.get(`${API_PREFIX}/admin/observability/errors`, authMiddleware, requireRoles('ADMIN'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  return res.json({ errors: systemErrors.slice(0, limit) });
});

app.put(`${API_PREFIX}/users/me/profile`, authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (req.body.fullName) user.fullName = String(req.body.fullName).trim();
  return res.json({ user: toPublicUser(user) });
});

app.put(`${API_PREFIX}/users/me/password`, authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias' });
  }
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ message: 'Contraseña actual incorrecta' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.sessionInvalidBefore = Date.now();
  pushLog('info', `Contraseña actualizada: ${user.email}`);
  return res.json({ message: 'Contraseña actualizada. Inicia sesión de nuevo.' });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] http://localhost:${PORT} (JWT ${JWT_EXPIRES_IN})`);
});
