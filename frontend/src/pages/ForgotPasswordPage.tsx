import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import * as authApi from '../services/authApi';
import { getAuthErrorMessage } from '../utils/authErrors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await authApi.forgotPassword({ email });
      setSuccess(data.message);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Error al enviar solicitud'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos instrucciones a tu correo"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

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

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>

        <p className="auth-switch">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
