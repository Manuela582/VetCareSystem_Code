const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

/** @type {Map<string, { id: string, email: string, passwordHash: string, fullName: string, role: string }>} */
const usersByEmail = new Map();

async function seedDemoUser() {
  const email = 'demo@vetcare.co';
  if (usersByEmail.has(email)) return;

  const passwordHash = await bcrypt.hash('VetCare123', 10);
  usersByEmail.set(email, {
    id: randomUUID(),
    email,
    passwordHash,
    fullName: 'Dr. Demo Veterinario',
    role: 'VETERINARIO',
  });
}

function findByEmail(email) {
  return usersByEmail.get(email.toLowerCase().trim()) ?? null;
}

function findById(id) {
  for (const user of usersByEmail.values()) {
    if (user.id === id) return user;
  }
  return null;
}

async function createUser({ email, password, fullName, role }) {
  const normalized = email.toLowerCase().trim();
  if (usersByEmail.has(normalized)) {
    const err = new Error('EMAIL_EXISTS');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const user = {
    id: randomUUID(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 10),
    fullName: fullName.trim(),
    role,
  };
  usersByEmail.set(normalized, user);
  return user;
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

module.exports = {
  seedDemoUser,
  findByEmail,
  findById,
  createUser,
  toPublicUser,
};
