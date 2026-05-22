const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const SERVICE_NAME = 'clinical-history';
const PORT = Number(process.env.PORT) || 3002;
const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'vetcare-dev-secret-cambiar-en-produccion';
const OWNER_DEMO_ID = '00000000-0000-4000-8000-000000000003';
const REMINDERS_URL = process.env.REMINDERS_URL || 'http://localhost:3003';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL || 'http://localhost:3006';

/** @type {Map<string, object>} */
const petsById = new Map();

/** @type {Map<string, object>} */
const recordsById = new Map();

const CLINICAL_STATUSES = ['ACTIVA', 'SEGUIMIENTO', 'CERRADA', 'URGENTE'];
const LUNA_PET_ID = '10000000-0000-4000-8000-000000000001';

/*
 * SEGURIDAD (PDF §3.1)
 * Esc.1 — Ver historial sin permiso: authMiddleware, canAccessPet, getPetOr404, GET .../records
 * Esc.2 — Editar sin ser veterinario: canEditClinical, POST / PUT / DELETE .../records
 *
 * FIABILIDAD (PDF §3.2)
 * Esc.4 — Registro correcto de consulta: validateRecordBody, POST .../records, createAutoReminders
 *         Confirmación al usuario: frontend ClinicalRecordFormPage (mensaje de éxito).
 * Esc.3 — Failover de almacenamiento: NO está aquí; ver services/storage-service (stub + /health).
 */

/*
 * Escenario 2 — Regla central: ¿este rol puede modificar consultas del historial?
 * Devuelve false para DUENO → las rutas POST/PUT/DELETE usarán eso para bloquear.
 */
function canEditClinical(userRole) {
  return userRole === 'VETERINARIO' || userRole === 'ADMIN';
}

/*
 * Escenario 1 — Primera barrera al pedir historial (va antes de GET/POST/PUT de registros).
 * Sin sesión válida no llega a leer ni a intentar editar datos.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  // BLOQUEO + pedir sesión: quien llama sin haber iniciado sesión en user-management.
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido', code: 'TOKEN_INVALID' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    // Sesión válida: guardamos id y rol para las siguientes comprobaciones.
    req.userId = payload.sub;
    req.userRole = payload.role;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    // BLOQUEO: sesión expirada o inválida.
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesión expirada', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token inválido', code: 'TOKEN_INVALID' });
  }
}

/*
 * Escenario 1 — Segunda barrera al VER historial: ¿esta mascota le pertenece?
 * Dueño ajeno → false → getPetOr404 bloqueará con "sin permiso".
 */
function canAccessPet(pet, userId, userRole) {
  if (userRole === 'VETERINARIO' || userRole === 'ADMIN') return true;
  return pet.ownerId === userId;
}

function validatePetBody(body, isUpdate = false) {
  const errors = [];
  const name = body.name?.trim();
  const species = body.species?.trim();
  const breed = body.breed?.trim();
  const age = Number(body.age);
  const weight = Number(body.weight);

  if (!isUpdate || body.name !== undefined) {
    if (!name) errors.push('El nombre es obligatorio');
  }
  if (!isUpdate || body.species !== undefined) {
    if (!species) errors.push('La especie es obligatoria');
  }
  if (!isUpdate || body.breed !== undefined) {
    if (!breed) errors.push('La raza es obligatoria');
  }
  if (!isUpdate || body.age !== undefined) {
    if (Number.isNaN(age) || age < 0) errors.push('La edad debe ser un número válido');
  }
  if (!isUpdate || body.weight !== undefined) {
    if (Number.isNaN(weight) || weight <= 0) errors.push('El peso debe ser mayor a 0');
  }
  if (body.photo && String(body.photo).length > 3_000_000) {
    errors.push('La foto es demasiado grande (máx. ~2 MB)');
  }

  return { errors, name, species, breed, age, weight };
}

function normalizeOwnerNotes(pet) {
  if (!pet.ownerNotes) {
    pet.ownerNotes = { habits: '', feeding: '', symptoms: '' };
  }
  return pet;
}

async function postReminder(authHeader, payload) {
  try {
    const res = await fetch(`${REMINDERS_URL}/api/v1/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reminder;
  } catch {
    return null;
  }
}

async function notifyOwner(authHeader, ownerId, subject, body, channel = 'IN_APP') {
  try {
    await fetch(`${NOTIFICATIONS_URL}/api/v1/notifications/demo-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ userId: ownerId, subject, body, channel }),
    });
  } catch {
    /* silencioso en demo */
  }
}

// Escenario 4 — Después de un registro exitoso, tareas derivadas (recordatorios al dueño).
async function createAutoReminders(req, pet, record) {
  const auth = req.headers.authorization;
  if (!auth) return [];

  const created = [];
  const recordDate = new Date(record.date);

  if (record.vaccines?.length > 0) {
    const due = new Date(recordDate);
    due.setFullYear(due.getFullYear() + 1);
    const reminder = await postReminder(auth, {
      petId: pet.id,
      petName: pet.name,
      type: 'VACUNA',
      title: `Refuerzo vacunas: ${record.vaccines.join(', ')}`,
      dueDate: due.toISOString().slice(0, 10),
      message: 'Alerta generada automáticamente tras registro de vacunación',
    });
    if (reminder) {
      created.push(reminder);
      await notifyOwner(
        auth,
        pet.ownerId,
        `Vacuna programada — ${pet.name}`,
        `${reminder.title} · vence ${reminder.dueDate}`,
        'PUSH',
      );
    }
  }

  if (record.status === 'SEGUIMIENTO') {
    const due = new Date(recordDate);
    due.setDate(due.getDate() + 15);
    const reminder = await postReminder(auth, {
      petId: pet.id,
      petName: pet.name,
      type: 'CONTROL',
      title: `Control de seguimiento — ${record.diagnosis.slice(0, 40)}`,
      dueDate: due.toISOString().slice(0, 10),
      message: record.observations || 'Control periódico generado automáticamente',
    });
    if (reminder) {
      created.push(reminder);
      await notifyOwner(
        auth,
        pet.ownerId,
        `Control pendiente — ${pet.name}`,
        `${reminder.title} · ${reminder.dueDate}`,
        'EMAIL',
      );
    }
  }

  return created;
}

function seedPets() {
  if (petsById.size > 0) return;
  const demo = {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Luna',
    species: 'Perro',
    breed: 'Labrador',
    age: 3,
    weight: 28.5,
    ownerId: OWNER_DEMO_ID,
    ownerName: 'Dueño Demo',
    photo: null,
    ownerNotes: {
      habits: 'Paseos diarios 30 min, socializa con otros perros.',
      feeding: 'Concentrado premium 2 veces al día, sin comida humana.',
      symptoms: 'Rascado leve en abdomen (reportado por dueño).',
    },
    createdAt: new Date().toISOString(),
  };
  petsById.set(demo.id, demo);
}

function seedRecords() {
  if (recordsById.size > 0) return;
  const now = new Date();
  const samples = [
    {
      id: '20000000-0000-4000-8000-000000000001',
      petId: LUNA_PET_ID,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString(),
      diagnosis: 'Control rutinario — buen estado general',
      treatment: 'Desparasitación oral',
      vaccines: ['Rabia', 'Polivalente'],
      observations: 'Paciente activa, apetito normal.',
      status: 'CERRADA',
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      petId: LUNA_PET_ID,
      date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
      diagnosis: 'Dermatitis leve en zona abdominal',
      treatment: 'Shampoo medicado 2 veces por semana',
      vaccines: [],
      observations: 'Control en 15 días. Evitar rascado.',
      status: 'SEGUIMIENTO',
    },
  ];
  for (const s of samples) {
    recordsById.set(s.id, {
      ...s,
      createdAt: s.date,
      updatedAt: s.date,
    });
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

seedPets();
seedRecords();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, version: '0.3.0' });
});

app.get(`${API_PREFIX}/admin/stats`, authMiddleware, (req, res) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Solo administradores', code: 'FORBIDDEN' });
  }
  const records = [...recordsById.values()];
  const byStatus = { ACTIVA: 0, SEGUIMIENTO: 0, CERRADA: 0, URGENTE: 0 };
  for (const r of records) {
    if (byStatus[r.status] !== undefined) byStatus[r.status]++;
  }
  return res.json({
    totalPets: petsById.size,
    totalRecords: records.length,
    recordsByStatus: byStatus,
  });
});

app.get(`${API_PREFIX}/pets`, authMiddleware, (req, res) => {
  let pets = [...petsById.values()];
  if (req.userRole === 'DUENO') {
    pets = pets.filter((p) => p.ownerId === req.userId);
  }
  const { search, vaccine, from, to } = req.query;
  if (search) {
    const q = String(search).toLowerCase();
    pets = pets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        (p.ownerName && p.ownerName.toLowerCase().includes(q)) ||
        (p.ownerId && p.ownerId.toLowerCase().includes(q)),
    );
  }
  if (vaccine) {
    const vq = String(vaccine).toLowerCase();
    const petIdsWithVaccine = new Set(
      [...recordsById.values()]
        .filter((r) => r.vaccines.some((v) => v.toLowerCase().includes(vq)))
        .map((r) => r.petId),
    );
    pets = pets.filter((p) => petIdsWithVaccine.has(p.id));
  }
  if (from || to) {
    const fromTs = from ? new Date(from).getTime() : 0;
    const toTs = to ? new Date(to).getTime() + 86400000 : Infinity;
    const petIdsInRange = new Set(
      [...recordsById.values()]
        .filter((r) => {
          const t = new Date(r.date).getTime();
          return t >= fromTs && t < toTs;
        })
        .map((r) => r.petId),
    );
    pets = pets.filter((p) => petIdsInRange.has(p.id));
  }
  pets.sort((a, b) => a.name.localeCompare(b.name));
  return res.json({ pets: pets.map((p) => normalizeOwnerNotes({ ...p })) });
});

app.get(`${API_PREFIX}/pets/:id`, authMiddleware, (req, res) => {
  const pet = petsById.get(req.params.id);
  if (!pet) return res.status(404).json({ message: 'Mascota no encontrada' });
  if (!canAccessPet(pet, req.userId, req.userRole)) {
    return res.status(403).json({ message: 'No tienes permiso para ver esta mascota', code: 'FORBIDDEN' });
  }
  return res.json({ pet: normalizeOwnerNotes({ ...pet }) });
});

app.patch(`${API_PREFIX}/pets/:id/owner-notes`, authMiddleware, (req, res) => {
  const pet = petsById.get(req.params.id);
  if (!pet) return res.status(404).json({ message: 'Mascota no encontrada' });
  if (!canAccessPet(pet, req.userId, req.userRole)) {
    return res.status(403).json({ message: 'No tienes permiso sobre esta mascota', code: 'FORBIDDEN' });
  }
  if (req.userRole !== 'DUENO' && req.userRole !== 'ADMIN') {
    return res.status(403).json({
      message: 'Solo el dueño o administrador pueden actualizar información complementaria',
      code: 'FORBIDDEN',
    });
  }
  if (req.userRole === 'DUENO' && pet.ownerId !== req.userId) {
    return res.status(403).json({ message: 'Solo puedes editar tus propias mascotas', code: 'FORBIDDEN' });
  }

  const habits = String(req.body?.habits ?? pet.ownerNotes?.habits ?? '').trim();
  const feeding = String(req.body?.feeding ?? pet.ownerNotes?.feeding ?? '').trim();
  const symptoms = String(req.body?.symptoms ?? pet.ownerNotes?.symptoms ?? '').trim();
  pet.ownerNotes = { habits, feeding, symptoms };
  return res.json({ pet: normalizeOwnerNotes({ ...pet }) });
});

app.post(`${API_PREFIX}/pets`, authMiddleware, (req, res) => {
  const { errors, name, species, breed, age, weight } = validatePetBody(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join('. ') });

  let ownerId = req.body.ownerId;
  let ownerName = req.body.ownerName?.trim() || '';

  if (req.userRole === 'DUENO') {
    ownerId = req.userId;
    ownerName = req.body.ownerName?.trim() || req.userEmail || 'Dueño';
  } else if (!ownerId) {
    return res.status(400).json({ message: 'Debes seleccionar un dueño' });
  }

  const pet = {
    id: randomUUID(),
    name,
    species,
    breed,
    age,
    weight,
    ownerId,
    ownerName: ownerName || 'Dueño',
    photo: req.body.photo || null,
    ownerNotes: { habits: '', feeding: '', symptoms: '' },
    createdAt: new Date().toISOString(),
  };
  petsById.set(pet.id, pet);
  return res.status(201).json({ pet: normalizeOwnerNotes(pet) });
});

app.put(`${API_PREFIX}/pets/:id`, authMiddleware, (req, res) => {
  const pet = petsById.get(req.params.id);
  if (!pet) return res.status(404).json({ message: 'Mascota no encontrada' });
  if (req.userRole === 'DUENO') {
    return res.status(403).json({
      message: 'Usa la sección de información complementaria para actualizar hábitos, alimentación y síntomas',
      code: 'FORBIDDEN',
    });
  }
  if (!canAccessPet(pet, req.userId, req.userRole)) {
    return res.status(403).json({ message: 'No tienes permiso para editar esta mascota', code: 'FORBIDDEN' });
  }

  const { errors, name, species, breed, age, weight } = validatePetBody(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join('. ') });

  if (name) pet.name = name;
  if (species) pet.species = species;
  if (breed) pet.breed = breed;
  if (!Number.isNaN(age) && req.body.age !== undefined) pet.age = age;
  if (!Number.isNaN(weight) && req.body.weight !== undefined) pet.weight = weight;
  if (req.body.photo !== undefined) pet.photo = req.body.photo || null;

  if (req.userRole !== 'DUENO' && req.body.ownerId) {
    pet.ownerId = req.body.ownerId;
    if (req.body.ownerName) pet.ownerName = req.body.ownerName.trim();
  }

  return res.json({ pet: normalizeOwnerNotes({ ...pet }) });
});

app.delete(`${API_PREFIX}/pets/:id`, authMiddleware, (req, res) => {
  const pet = petsById.get(req.params.id);
  if (!pet) return res.status(404).json({ message: 'Mascota no encontrada' });
  if (req.userRole === 'DUENO') {
    return res.status(403).json({
      message: 'Los dueños no pueden eliminar mascotas',
      code: 'FORBIDDEN',
    });
  }
  if (!canAccessPet(pet, req.userId, req.userRole)) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar esta mascota', code: 'FORBIDDEN' });
  }
  const petId = req.params.id;
  [...recordsById.values()]
    .filter((r) => r.petId === petId)
    .forEach((r) => recordsById.delete(r.id));
  petsById.delete(petId);
  return res.json({ message: 'Mascota eliminada correctamente' });
});

/*
 * Escenario 1 — Se llama justo antes de devolver o modificar el historial de una mascota.
 * Aquí se decide si ese usuario puede trabajar con ESA mascota.
 */
function getPetOr404(petId, req, res) {
  const pet = petsById.get(petId);
  if (!pet) {
    res.status(404).json({ message: 'Mascota no encontrada' });
    return null;
  }
  // BLOQUEO Esc.1: dueño intentando ver historial de mascota de otro dueño.
  if (!canAccessPet(pet, req.userId, req.userRole)) {
    res.status(403).json({ message: 'Sin permiso sobre esta mascota', code: 'FORBIDDEN' });
    return null;
  }
  return pet;
}

function filterRecords(records, query) {
  let list = [...records];
  const { search, from, to, status } = query;

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (r) =>
        r.diagnosis.toLowerCase().includes(q) ||
        r.treatment.toLowerCase().includes(q) ||
        r.observations.toLowerCase().includes(q) ||
        r.vaccines.some((v) => v.toLowerCase().includes(q)),
    );
  }
  if (from) {
    const fromTs = new Date(from).getTime();
    list = list.filter((r) => new Date(r.date).getTime() >= fromTs);
  }
  if (to) {
    const toTs = new Date(to).getTime() + 86400000;
    list = list.filter((r) => new Date(r.date).getTime() < toTs);
  }
  if (status && CLINICAL_STATUSES.includes(status)) {
    list = list.filter((r) => r.status === status);
  }

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/*
 * Escenario 4 — Antes de guardar, revisar que los datos de la consulta sean válidos.
 * Si hay errores, devuelve lista de mensajes → la ruta POST responde 400 (no guarda basura).
 */
function validateRecordBody(body, isUpdate = false) {
  const errors = [];
  const diagnosis = body.diagnosis?.trim();
  const treatment = body.treatment?.trim() || '';
  const observations = body.observations?.trim() || '';
  const vaccines = Array.isArray(body.vaccines)
    ? body.vaccines.map((v) => String(v).trim()).filter(Boolean)
    : String(body.vaccines || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
  const status = CLINICAL_STATUSES.includes(body.status) ? body.status : 'ACTIVA';
  const date = body.date ? new Date(body.date).toISOString() : null;

  // Esc.4: campos obligatorios para una consulta nueva (reduce errores de registro).
  if (!isUpdate || body.diagnosis !== undefined) {
    if (!diagnosis) errors.push('El diagnóstico es obligatorio');
  }
  if (!isUpdate || body.date !== undefined) {
    if (!date || Number.isNaN(new Date(date).getTime())) errors.push('La fecha no es válida');
  }

  return { errors, diagnosis, treatment, observations, vaccines, status, date };
}

/*
 * Escenario 1 — Ver listado del historial clínico.
 * Flujo: authMiddleware (sesión) → getPetOr404 (permiso sobre la mascota) → datos.
 */
app.get(`${API_PREFIX}/patients/:petId/records`, authMiddleware, (req, res) => {
  if (!getPetOr404(req.params.petId, req, res)) return; // si devolvió null, ya se bloqueó arriba

  const records = filterRecords(
    [...recordsById.values()].filter((r) => r.petId === req.params.petId),
    req.query,
  );
  return res.json({ records });
});

// Escenario 1 — Ver un registro concreto (mismas barreras: sesión + mascota permitida).
app.get(`${API_PREFIX}/patients/:petId/records/:recordId`, authMiddleware, (req, res) => {
  if (!getPetOr404(req.params.petId, req, res)) return;

  const record = recordsById.get(req.params.recordId);
  if (!record || record.petId !== req.params.petId) {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }
  return res.json({ record });
});

/*
 * Escenario 4 — Veterinario registra una nueva consulta (PDF §3.2).
 * Flujo: sesión → permiso rol (Esc.2) → validar datos → guardar → confirmar (201 + JSON).
 * Estímulo: alta de consulta médica. Artefacto: clinical-history.
 */
app.post(`${API_PREFIX}/patients/:petId/records`, authMiddleware, async (req, res) => {
  if (!getPetOr404(req.params.petId, req, res)) return;

  // Esc.2: solo veterinario/admin puede registrar (el veterinario del PDF pasa esta línea).
  if (!canEditClinical(req.userRole)) {
    return res.status(403).json({
      message: 'Solo veterinarios pueden crear consultas',
      code: 'FORBIDDEN',
    });
  }

  const { errors, diagnosis, treatment, observations, vaccines, status, date } =
    validateRecordBody(req.body);
  // Esc.4: datos inválidos → no se guarda; se explica el error al cliente.
  if (errors.length) return res.status(400).json({ message: errors.join('. ') });

  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    petId: req.params.petId,
    date,
    diagnosis,
    treatment,
    vaccines,
    observations,
    status,
    createdAt: now,
    updatedAt: now,
  };
  // Esc.4: aquí se persiste la consulta (demo: memoria; producción: base de datos del servicio).
  recordsById.set(record.id, record);
  const pet = petsById.get(req.params.petId);
  // Esc.4 extra: tras guardar bien, opcionalmente crea recordatorios (vacuna, seguimiento).
  const autoReminders = pet ? await createAutoReminders(req, pet, record) : [];
  // CONFIRMACIÓN Esc.4: 201 Created + registro guardado (el frontend muestra mensaje de éxito).
  return res.status(201).json({ record, autoReminders });
});

/*
 * Escenario 2 — Editar consulta (estímulo del PDF: intento de edición del historial).
 * El bloqueo ocurre en el if de abajo, antes de tocar el registro en memoria.
 */
app.put(`${API_PREFIX}/patients/:petId/records/:recordId`, authMiddleware, (req, res) => {
  if (!getPetOr404(req.params.petId, req, res)) return;

  // BLOQUEO Esc.2: aquí se rechaza la edición y se notifica al cliente (mensaje en JSON).
  if (!canEditClinical(req.userRole)) {
    return res.status(403).json({
      message: 'Solo veterinarios pueden editar registros',
      code: 'FORBIDDEN',
    });
  }

  const record = recordsById.get(req.params.recordId);
  if (!record || record.petId !== req.params.petId) {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }

  const { errors, diagnosis, treatment, observations, vaccines, status, date } =
    validateRecordBody(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join('. ') });

  if (diagnosis) record.diagnosis = diagnosis;
  if (req.body.treatment !== undefined) record.treatment = treatment;
  if (req.body.observations !== undefined) record.observations = observations;
  if (req.body.vaccines !== undefined) record.vaccines = vaccines;
  if (req.body.status !== undefined) record.status = status;
  if (date) record.date = date;
  record.updatedAt = new Date().toISOString();

  return res.json({ record });
});

// Escenario 2 — Eliminar consulta (misma lógica de bloqueo que PUT).
app.delete(`${API_PREFIX}/patients/:petId/records/:recordId`, authMiddleware, (req, res) => {
  if (!getPetOr404(req.params.petId, req, res)) return;

  // BLOQUEO Esc.2: dueño no puede borrar registros clínicos.
  if (!canEditClinical(req.userRole)) {
    return res.status(403).json({
      message: 'Solo veterinarios pueden eliminar registros',
      code: 'FORBIDDEN',
    });
  }

  const record = recordsById.get(req.params.recordId);
  if (!record || record.petId !== req.params.petId) {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }
  recordsById.delete(req.params.recordId);
  return res.json({ message: 'Registro eliminado correctamente' });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] http://localhost:${PORT}`);
});
