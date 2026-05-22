import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SessionBadge } from '../SessionBadge';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../hooks/useTheme';

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
            <span className="material-symbols-rounded">menu</span>
          </button>

          <div className="app-topbar__title">
            <h1>{title}</h1>
          </div>

          <div className="app-topbar__actions">
            <button type="button" className="btn-icon" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
              <span className="material-symbols-rounded">{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {/* Carrito */}
            <Link to="/carrito" className="btn-icon" title="Carrito" style={{ textDecoration: 'none', position: 'relative' }}>
              <span className="material-symbols-rounded">shopping_cart</span>
            </Link>

            {/* Notificaciones */}
            <div className="notif-dropdown" ref={notifRef}>
              <button
                type="button"
                className="btn-icon notif-bell"
                onClick={() => setNotifOpen(o => !o)}
                aria-label="Notificaciones"
              >
                <span className="material-symbols-rounded">notifications</span>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel__head">
                    <strong>Notifications</strong>
                    <button type="button" className="btn-text" onClick={() => markAllRead()}>
                      Mark all read
                    </button>
                  </div>

                  <ul>
                    {notifications.length === 0 ? (
                      <li className="notif-panel__empty">
                        <span className="material-symbols-rounded notif-panel__empty-icon">notifications_off</span>
                        <span>No notifications yet</span>
                      </li>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <li key={n.id} className={n.read ? '' : 'unread'}>
                          <div className="notif-panel__row">
                            <strong>{n.subject}</strong>
                            {n.channel && <span className="notif-channel">{n.channel}</span>}
                          </div>
                          <p>{n.body}</p>
                          {!n.read && (
                            <button type="button" className="btn-text" onClick={() => markRead(n.id)}>
                              Mark read
                            </button>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Avatar + logout */}
            <div className="topbar-avatar" title={user?.fullName}>
              {initials}
            </div>
            <SessionBadge />
            <button type="button" className="btn-icon" onClick={handleLogout} title="Cerrar sesión">
              <span className="material-symbols-rounded">logout</span>
            </button>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
