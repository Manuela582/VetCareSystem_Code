import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../services/authApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import heroImg from '../assets/hero.png';

function VeteCareLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="#4c1d95" strokeWidth="2" fill="#ede9fe"/>
      <path d="M20 5 L33 12.5 L33 27.5 L20 35 L7 27.5 L7 12.5 Z" fill="#4c1d95"/>
      <rect x="17" y="12" width="6" height="16" rx="3" fill="white"/>
      <rect x="12" y="17" width="16" height="6" rx="3" fill="white"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authNotice, clearAuthNotice } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => { if (authNotice) setError(authNotice); }, [authNotice]);
  useEffect(() => () => clearAuthNotice(), [clearAuthNotice]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    clearAuthNotice();
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user, data.expiresAt);
      const home =
        data.user.role === 'ADMIN'       ? '/admin' :
        data.user.role === 'VETERINARIO' ? '/panel/veterinario' :
        data.user.role === 'DUENO'       ? '/panel/dueno' : '/inicio';
      navigate(home);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Credenciales incorrectas. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* ── Panel izquierdo: formulario ───────────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          <div className="login-logo">
            <VeteCareLogo />
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">
            Log in to your veterinary dashboard to manage your patients.
          </p>

          {(error || redirectMessage) && (
            <p className="login-error">{error || redirectMessage}</p>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Medical Email Address
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon material-symbols-rounded">mail</span>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dr.smith@vetecare.pro"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="login-password">
                  Secure Password
                </label>
                <Link to="/recuperar-contrasena" className="login-forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon material-symbols-rounded">lock</span>
                <input
                  id="login-password"
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-rounded">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span>Remember this device for 30 days</span>
            </label>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Secure Login →'}
            </button>
          </form>

          <p className="login-register">
            New to VeteCare?{' '}
            <Link to="/registro" className="login-register-link">
              Establish your practice
            </Link>
          </p>

          <div className="login-badges">
            <span className="login-badge">
              <span className="material-symbols-rounded">verified_user</span>
              HIPAA Compliant
            </span>
            <span className="login-badge">
              <span className="material-symbols-rounded">lock</span>
              256-bit AES
            </span>
          </div>
        </div>
      </div>

      {/* ── Panel derecho: imagen ─────────────────────────────────────────────── */}
      <div
        className="login-image-panel"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="login-image-overlay" />
        <div className="login-testimonial">
          <span className="login-testimonial__quote">"</span>
          <p>
            VeteCare has transformed how our clinic handles triage. The efficiency
            gain is immeasurable when managing critical cases.
          </p>
          <div className="login-testimonial__author">
            <div className="login-testimonial__avatar">JS</div>
            <div>
              <strong>Dr. Julian Sterling</strong>
              <span>Chief of Surgery, Metro Vet Partners</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
