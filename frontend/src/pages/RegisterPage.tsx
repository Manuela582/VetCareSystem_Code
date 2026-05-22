import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import * as petsApi from '../services/petsApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { UserRole } from '../types/auth';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface UserForm {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

interface PetForm {
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  allergies: string;
  clinicalNotes: string;
}

const SPECIES = ['Perro', 'Gato', 'Conejo', 'Ave', 'Reptil', 'Otro'];

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function VeteCareLogoReg() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="#4c1d95" strokeWidth="2" fill="#f5f3ff"/>
      <path d="M20 5 L33 12.5 L33 27.5 L20 35 L7 27.5 L7 12.5 Z" fill="#4c1d95"/>
      <rect x="17" y="12" width="6" height="16" rx="3" fill="white"/>
      <rect x="12" y="17" width="16" height="6" rx="3" fill="white"/>
    </svg>
  );
}

function StepIndicator({ step, isDueno }: { step: number; isDueno: boolean }) {
  const steps = isDueno
    ? ['Tu cuenta', 'Tu mascota', '¡Listo!']
    : ['Tu cuenta', '¡Listo!'];

  return (
    <div className="reg-steps">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} className={`reg-step ${isActive ? 'reg-step--active' : ''} ${isDone ? 'reg-step--done' : ''}`}>
            <div className="reg-step__circle">
              {isDone ? <span className="material-symbols-rounded" style={{fontSize:'1rem'}}>check</span> : num}
            </div>
            <span className="reg-step__label">{label}</span>
            {i < steps.length - 1 && <div className="reg-step__line" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userForm, setUserForm] = useState<UserForm>({
    fullName: '', email: '', password: '', phone: '', role: 'DUENO',
  });

  const [petForm, setPetForm] = useState<PetForm>({
    name: '', species: 'Perro', breed: '', age: '', weight: '',
    allergies: '', clinicalNotes: '',
  });

  const [registeredUser, setRegisteredUser] = useState<{ id: string; token: string; expiresAt: number } | null>(null);

  const isDueno = userForm.role === 'DUENO';
  const totalSteps = isDueno ? 3 : 2;

  // ── Step 1: registrar usuario ──────────────────────────────────────────────
  async function handleStep1(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register({
        fullName: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        phone: userForm.phone || undefined,
      });
      login(data.token, data.user, data.expiresAt);
      setRegisteredUser({ id: data.user.id, token: data.token, expiresAt: data.expiresAt });
      setStep(isDueno ? 2 : totalSteps);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'No se pudo crear la cuenta'));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: registrar mascota ──────────────────────────────────────────────
  async function handleStep2(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await petsApi.createPet({
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed,
        age: Number(petForm.age),
        weight: Number(petForm.weight),
        ownerId: registeredUser?.id,
        allergies: petForm.allergies || undefined,
        clinicalNotes: petForm.clinicalNotes || undefined,
      });
      setStep(totalSteps);
    } catch {
      // Si falla la creación de mascota, avanzamos igual (puede agregar después)
      setStep(totalSteps);
    } finally {
      setLoading(false);
    }
  }

  function skipPet() {
    setStep(totalSteps);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="reg-page">
      {/* Panel izquierdo brand */}
      <aside className="reg-brand">
        <div className="reg-brand__inner">
          <div className="reg-brand__logo">
            <VeteCareLogoReg />
            <span className="reg-brand__name">VeteCare</span>
          </div>
          <h2 className="reg-brand__tagline">
            La plataforma veterinaria<br />que cuida a tus mascotas
          </h2>
          <ul className="reg-brand__list">
            <li><span className="material-symbols-rounded">storefront</span> Marketplace con productos veterinarios</li>
            <li><span className="material-symbols-rounded">home_health</span> Atención a domicilio cuando lo necesites</li>
            <li><span className="material-symbols-rounded">medication</span> Recordatorios de vacunas y tratamientos</li>
            <li><span className="material-symbols-rounded">history</span> Historial clínico siempre disponible</li>
            <li><span className="material-symbols-rounded">videocam</span> Consultas virtuales con veterinarios</li>
          </ul>
        </div>
      </aside>

      {/* Panel derecho — formulario */}
      <main className="reg-main">
        <div className="reg-form-wrap">

          {/* Header */}
          <div className="reg-header">
            <Link to="/login" className="reg-back">← Volver al login</Link>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} isDueno={isDueno} />

          {/* ── STEP 1: Cuenta ── */}
          {step === 1 && (
            <form className="reg-form" onSubmit={handleStep1}>
              <h2 className="reg-form__title">Crea tu cuenta</h2>
              <p className="reg-form__sub">Completa tus datos para comenzar</p>

              {error && <p className="auth-error">{error}</p>}

              <label className="reg-label">
                Nombre completo *
                <input
                  className="reg-input"
                  type="text"
                  value={userForm.fullName}
                  onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="María García"
                  required
                  autoComplete="name"
                />
              </label>

              <label className="reg-label">
                Correo electrónico *
                <input
                  className="reg-input"
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="maria@correo.com"
                  required
                  autoComplete="email"
                />
              </label>

              <label className="reg-label">
                Contraseña *
                <input
                  className="reg-input"
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </label>

              <label className="reg-label">
                Teléfono <span className="reg-optional">(opcional)</span>
                <input
                  className="reg-input"
                  type="tel"
                  value={userForm.phone}
                  onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="3001234567"
                />
              </label>

              <div className="reg-role-group">
                <p className="reg-role-label">¿Cómo usarás VeteCare?</p>
                <div className="reg-role-cards">
                  <button
                    type="button"
                    className={`reg-role-card ${userForm.role === 'DUENO' ? 'reg-role-card--active' : ''}`}
                    onClick={() => setUserForm(f => ({ ...f, role: 'DUENO' }))}
                  >
                    <span className="reg-role-card__icon material-symbols-rounded">pets</span>
                    <strong>Dueño</strong>
                    <span>Tengo mascotas y quiero cuidarlas</span>
                  </button>
                  <button
                    type="button"
                    className={`reg-role-card ${userForm.role === 'VETERINARIO' ? 'reg-role-card--active' : ''}`}
                    onClick={() => setUserForm(f => ({ ...f, role: 'VETERINARIO' }))}
                  >
                    <span className="reg-role-card__icon material-symbols-rounded">medical_services</span>
                    <strong>Veterinario</strong>
                    <span>Ofrezco servicios veterinarios</span>
                  </button>
                </div>
              </div>

              <button type="submit" className="reg-btn-primary" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Continuar →'}
              </button>

              <p className="reg-switch">
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: Mascota (solo DUENO) ── */}
          {step === 2 && isDueno && (
            <form className="reg-form" onSubmit={handleStep2}>
              <h2 className="reg-form__title">Cuéntanos sobre tu mascota</h2>
              <p className="reg-form__sub">
                Agrega tu primera mascota ahora —{' '}
                <button type="button" className="reg-skip" onClick={skipPet}>
                  saltar por ahora
                </button>
              </p>

              {error && <p className="auth-error">{error}</p>}

              <div className="reg-row">
                <label className="reg-label">
                  Nombre de la mascota *
                  <input
                    className="reg-input"
                    type="text"
                    value={petForm.name}
                    onChange={e => setPetForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Luna, Max, Mia…"
                    required
                  />
                </label>

                <label className="reg-label">
                  Especie *
                  <select
                    className="reg-input"
                    value={petForm.species}
                    onChange={e => setPetForm(f => ({ ...f, species: e.target.value }))}
                    required
                  >
                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div className="reg-row">
                <label className="reg-label">
                  Raza *
                  <input
                    className="reg-input"
                    type="text"
                    value={petForm.breed}
                    onChange={e => setPetForm(f => ({ ...f, breed: e.target.value }))}
                    placeholder="Labrador, Siamés…"
                    required
                  />
                </label>

                <label className="reg-label">
                  Edad (años) *
                  <input
                    className="reg-input"
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={petForm.age}
                    onChange={e => setPetForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="2"
                    required
                  />
                </label>

                <label className="reg-label">
                  Peso (kg) *
                  <input
                    className="reg-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={petForm.weight}
                    onChange={e => setPetForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="8.5"
                    required
                  />
                </label>
              </div>

              <label className="reg-label">
                Alergias conocidas <span className="reg-optional">(opcional)</span>
                <input
                  className="reg-input"
                  type="text"
                  value={petForm.allergies}
                  onChange={e => setPetForm(f => ({ ...f, allergies: e.target.value }))}
                  placeholder="Polen, pollo, antibióticos…"
                />
              </label>

              <label className="reg-label">
                Historial clínico previo <span className="reg-optional">(opcional)</span>
                <textarea
                  className="reg-input reg-textarea"
                  value={petForm.clinicalNotes}
                  onChange={e => setPetForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                  placeholder="Cirugías, enfermedades crónicas, medicamentos actuales…"
                  rows={3}
                />
              </label>

              <div className="reg-actions">
                <button type="submit" className="reg-btn-primary" disabled={loading}>
                  {loading ? 'Guardando…' : 'Registrar mascota →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP FINAL: Éxito ── */}
          {step === totalSteps && (
            <div className="reg-success">
              <div className="reg-success__icon">
                <span className="material-symbols-rounded" style={{fontSize:'4rem',color:'var(--color-primary)'}}>celebration</span>
              </div>
              <h2>¡Bienvenido a VeteCare!</h2>
              <p>Tu cuenta ha sido creada exitosamente.</p>
              {isDueno && step === totalSteps && (
                <p className="reg-success__sub">
                  Puedes gestionar tus mascotas, pedir atención a domicilio y explorar el marketplace desde tu panel.
                </p>
              )}
              <button
                type="button"
                className="reg-btn-primary"
                onClick={() => navigate('/inicio')}
              >
                Ir a mi panel →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
