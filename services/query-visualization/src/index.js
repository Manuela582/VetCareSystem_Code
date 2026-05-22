const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const SERVICE_NAME = 'query-visualization';
const PORT = Number(process.env.PORT) || 3005;
const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'vetcare-dev-secret-cambiar-en-produccion';

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

async function fetchJson(url, authHeader) {
  const res = await fetch(url, { headers: authHeader ? { Authorization: authHeader } : {} });
  if (!res.ok) return null;
  return res.json();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, version: '0.2.0' });
});

app.get(`${API_PREFIX}/dashboard`, authMiddleware, async (req, res) => {
  const auth = req.headers.authorization;
  const [petsData, remindersData] = await Promise.all([
    fetchJson('http://localhost:3002/api/v1/pets', auth),
    fetchJson('http://localhost:3003/api/v1/reminders', auth),
  ]);

  const pets = petsData?.pets || [];
  const reminders = (remindersData?.reminders || []).map((r) => {
    const due = new Date(r.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let status = r.status;
    if (status !== 'COMPLETADO' && due < today) status = 'VENCIDO';
    return { ...r, status };
  });

  const upcomingVaccines = reminders
    .filter((r) => r.type === 'VACUNA' && r.status === 'PENDIENTE')
    .slice(0, 5);
  const activeAlerts = reminders.filter((r) => r.status === 'VENCIDO' || r.status === 'PENDIENTE').slice(0, 5);

  let recentConsultations = [];
  let totalRecords = 0;
  for (const pet of pets.slice(0, 5)) {
    const rec = await fetchJson(
      `http://localhost:3002/api/v1/patients/${pet.id}/records`,
      auth,
    );
    if (rec?.records) {
      totalRecords += rec.records.length;
      recentConsultations.push(
        ...rec.records.slice(0, 2).map((r) => ({
          id: r.id,
          petId: pet.id,
          petName: pet.name,
          date: r.date,
          diagnosis: r.diagnosis,
          status: r.status,
        })),
      );
    }
  }
  recentConsultations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  recentConsultations = recentConsultations.slice(0, 6);

  const chartByStatus = { ACTIVA: 0, SEGUIMIENTO: 0, CERRADA: 0, URGENTE: 0 };
  for (const pet of pets.slice(0, 5)) {
    const rec = await fetchJson(
      `http://localhost:3002/api/v1/patients/${pet.id}/records`,
      auth,
    );
    if (rec?.records) {
      for (const r of rec.records) {
        if (chartByStatus[r.status] !== undefined) chartByStatus[r.status]++;
      }
    }
  }

  const stats = {
    totalPets: pets.length,
    totalRecords,
    pendingReminders: reminders.filter((r) => r.status === 'PENDIENTE').length,
    overdueReminders: reminders.filter((r) => r.status === 'VENCIDO').length,
    activeAlerts: activeAlerts.length,
  };

  const chartByReminderType = { VACUNA: 0, CONTROL: 0, TRATAMIENTO: 0 };
  for (const r of reminders) {
    if (chartByReminderType[r.type] !== undefined) chartByReminderType[r.type]++;
  }

  return res.json({
    stats,
    upcomingVaccines,
    activeAlerts,
    recentConsultations,
    charts: {
      recordsByStatus: chartByStatus,
      remindersByType: chartByReminderType,
    },
  });
});

app.get(`${API_PREFIX}/dashboard/:petId`, authMiddleware, async (req, res) => {
  const auth = req.headers.authorization;
  const petData = await fetchJson(`http://localhost:3002/api/v1/pets/${req.params.petId}`, auth);
  if (!petData?.pet) return res.status(404).json({ message: 'Mascota no encontrada' });

  const [recordsData, remindersData] = await Promise.all([
    fetchJson(`http://localhost:3002/api/v1/patients/${req.params.petId}/records`, auth),
    fetchJson(`http://localhost:3003/api/v1/reminders?petId=${req.params.petId}`, auth),
  ]);

  return res.json({
    pet: petData.pet,
    records: recordsData?.records || [],
    reminders: remindersData?.reminders || [],
  });
});

app.listen(PORT, () => console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`));
