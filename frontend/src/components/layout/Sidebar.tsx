import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

const links = [
  { to: '/inicio', label: 'Dashboard analítico', icon: '📊', roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/mascotas', label: 'Mascotas', icon: '🐾', roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/recordatorios', label: 'Recordatorios', icon: '🔔', roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/panel/veterinario', label: 'Panel vet.', icon: '🩺', roles: ['VETERINARIO', 'ADMIN'] },
  { to: '/panel/dueno', label: 'Panel dueño', icon: '🏠', roles: ['DUENO', 'ADMIN'] },
  { to: '/admin', label: 'Administración', icon: '⚙️', roles: ['ADMIN'] },
  { to: '/perfil', label: 'Mi perfil', icon: '👤', roles: ['DUENO', 'VETERINARIO', 'ADMIN'] },
  { to: '/api-docs', label: 'API / OpenAPI', icon: '📑', roles: ['VETERINARIO', 'ADMIN'] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasRole } = useAuth();

  return (
    <>
      {open && <button type="button" className="sidebar-backdrop" onClick={onClose} aria-label="Cerrar menú" />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">🐾 VetCare</div>
        <nav className="sidebar__nav">
          {links
            .filter((l) => hasRole(...(l.roles as UserRole[])))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={onClose}
              >
                <span aria-hidden>{l.icon}</span> {l.label}
              </NavLink>
            ))}
        </nav>
        <a
          href="https://github.com/Manuela582/VetCareSystem_Code"
          target="_blank"
          rel="noreferrer"
          className="sidebar__swagger"
        >
          📄 Repositorio / APIs
        </a>
      </aside>
    </>
  );
}
