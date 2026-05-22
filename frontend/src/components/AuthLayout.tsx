import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">🐾</span>
          <h1>VetCare</h1>
          <p>Gestión clínica veterinaria</p>
        </div>
        <div className="auth-form-wrap">
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </div>
      <footer className="auth-footer">
        <Link to="/login">Iniciar sesión</Link>
        <span>·</span>
        <Link to="/registro">Registrarse</Link>
      </footer>
    </div>
  );
}
