import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function VeteCareLogoAuth() {
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="rgba(255,255,255,0.12)"/>
      <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" fill="rgba(255,255,255,0.9)"/>
      <rect x="17" y="11" width="6" height="18" rx="3" fill="#4c1d95"/>
      <rect x="11" y="17" width="18" height="6" rx="3" fill="#4c1d95"/>
    </svg>
  );
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <VeteCareLogoAuth />
          <h1>VeteCare</h1>
          <p>Plataforma veterinaria inteligente</p>
          <ul className="auth-brand-features">
            <li>
              <span className="material-symbols-rounded">pets</span>
              Gestión clínica de mascotas
            </li>
            <li>
              <span className="material-symbols-rounded">storefront</span>
              Marketplace veterinario
            </li>
            <li>
              <span className="material-symbols-rounded">home_health</span>
              Atención a domicilio
            </li>
            <li>
              <span className="material-symbols-rounded">videocam</span>
              Consultas virtuales
            </li>
          </ul>
        </div>
        <div className="auth-form-wrap">
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
