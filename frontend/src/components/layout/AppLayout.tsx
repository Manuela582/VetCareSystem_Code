import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SessionBadge } from '../SessionBadge';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../hooks/useTheme';

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, markRead, markAllRead } = useNotifications();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app-layout__main">
        <header className="app-topbar">
          <button
            type="button"
            className="app-topbar__menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div className="app-topbar__title">
            <h1>{title}</h1>
            {user && <span>{user.fullName}</span>}
          </div>
          <div className="app-topbar__actions">
            <button type="button" className="btn-icon" onClick={toggle} title="Modo oscuro">
              {dark ? '☀️' : '🌙'}
            </button>
            <div className="notif-dropdown">
              <button
                type="button"
                className="btn-icon notif-bell"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notificaciones"
              >
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel__head">
                    <strong>Notificaciones</strong>
                    <button type="button" className="btn-text" onClick={() => markAllRead()}>
                      Marcar todas
                    </button>
                  </div>
                  {user?.role === 'DUENO' && (
                    <p className="notif-panel__hint">
                      Demo multicanal (PDF): IN_APP, correo y push simulados para tu cuenta.
                    </p>
                  )}
                  {user?.role === 'VETERINARIO' && (
                    <p className="notif-panel__hint">
                      Alertas clínicas IN_APP (ej. control vencido de Luna). El dueño recibe copias
                      por correo/push al registrar consultas.
                    </p>
                  )}
                  <ul>
                    {notifications.length === 0 && (
                      <li className="notif-panel__empty">Sin notificaciones</li>
                    )}
                    {notifications.slice(0, 8).map((n) => (
                      <li key={n.id} className={n.read ? '' : 'unread'}>
                        <div className="notif-panel__row">
                          <strong>{n.subject}</strong>
                          {n.channel && <span className="notif-channel">{n.channel}</span>}
                        </div>
                        <p>{n.body}</p>
                        {!n.read && (
                          <button type="button" className="btn-text" onClick={() => markRead(n.id)}>
                            Leída
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <SessionBadge />
            <button type="button" className="btn-outline" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
