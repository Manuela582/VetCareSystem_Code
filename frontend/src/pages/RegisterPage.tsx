import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { UserRole } from '../types/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('DUENO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.register({
        fullName,
        email,
        password,
        role,
      });
      login(data.token, data.user, data.expiresAt);
      navigate('/inicio');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'No se pudo registrar'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate como dueño o veterinario"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}

        <label>
          Nombre completo
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="María García"
            required
          />
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            autoComplete="email"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </label>

        <label>
          Tipo de usuario
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="DUENO">Dueño de mascota</option>
            <option value="VETERINARIO">Veterinario</option>
          </select>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Registrarse'}
        </button>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
