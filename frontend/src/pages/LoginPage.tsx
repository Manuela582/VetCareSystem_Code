import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import { getAuthErrorMessage } from '../utils/authErrors';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authNotice, clearAuthNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => {
    if (authNotice) setError(authNotice);
  }, [authNotice]);

  useEffect(() => {
    return () => clearAuthNotice();
  }, [clearAuthNotice]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    clearAuthNotice();
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user, data.expiresAt);
      const home =
        data.user.role === 'ADMIN'
          ? '/admin'
          : data.user.role === 'VETERINARIO'
            ? '/panel/veterinario'
            : data.user.role === 'DUENO'
              ? '/panel/dueno'
              : '/inicio';
      navigate(home);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede con tu correo y contraseña"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {(error || redirectMessage) && (
          <p className="auth-error">{error || redirectMessage}</p>
        )}

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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>

        <Link className="auth-link" to="/recuperar-contrasena">
          ¿Olvidaste tu contraseña?
        </Link>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>

        <p className="auth-demo">
          Veterinario: demo@vetcare.co / demo123 · Dueño: dueno@vetcare.co / dueno123 · Admin:{' '}
          admin@vetcare.co / admin123
        </p>
      </form>
    </AuthLayout>
  );
}
