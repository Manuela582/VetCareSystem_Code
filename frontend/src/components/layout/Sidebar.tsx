import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

const links: { to: string; label: string; icon: string; roles: UserRole[] }[] = [
  { to: '/inicio',            label: 'Dashboard',       icon: 'dashboard',        roles: ['VETERINARIO', 'ADMIN'] },
  { to: '/mascotas',          label: 'Patients',         icon: 'pets',             roles: ['VETERINARIO', 'ADMIN'] },
  { to: '/panel/dueno',       label: 'My Panel',        icon: 'home',             roles: ['DUENO'] },
  { to: '/marketplace',       label: 'Shop',            icon: 'storefront',       roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/recordatorios',     label: 'Appointments',    icon: 'calendar_month',   roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/panel/veterinario', label: 'Medical Records', icon: 'medical_services', roles: ['VETERINARIO', 'ADMIN'] },
  { to: '/admin',             label: 'Settings',        icon: 'settings',         roles: ['ADMIN'] },
  { to: '/perfil',            label: 'Profile',         icon: 'person',           roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/api-docs',          label: 'API Docs',        icon: 'api',              roles: ['VETERINARIO', 'ADMIN'] },
];

function VetCareLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="#4c1d95" strokeWidth="2" fill="white"/>
      <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" fill="#4c1d95"/>
      <rect x="17" y="11" width="6" height="18" rx="3" fill="white"/>
      <rect x="11" y="17" width="18" height="6" rx="3" fill="white"/>
    </svg>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasRole, user } = useAuth();

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      )}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <VetCareLogo />
          <span>VeteCare</span>
        </div>

        {user && (
          <div className="sidebar__user">
            <span className="sidebar__user-name">{user.fullName}</span>
            <span className="sidebar__user-role">{user.role}</span>
          </div>
        )}

        <nav className="sidebar__nav">
          {links
            .filter((l) => hasRole(...l.roles))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar__link-icon material-symbols-rounded" aria-hidden>
                  {l.icon}
                </span>
                <span>{l.label}</span>
              </NavLink>
            ))}
        </nav>

        {hasRole('VETERINARIO', 'ADMIN') && (
          <NavLink to="/mascotas/nueva" className="sidebar__triage" onClick={onClose}>
            <span className="material-symbols-rounded" aria-hidden>emergency</span>
            Emergency Triage
          </NavLink>
        )}

        <a
          href="https://github.com/Manuela582/VetCareSystem_Code"
          target="_blank"
          rel="noreferrer"
          className="sidebar__footer-link"
        >
          <span className="material-symbols-rounded" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
            open_in_new
          </span>{' '}
          Repository
        </a>
      </aside>
    </>
  );
}
