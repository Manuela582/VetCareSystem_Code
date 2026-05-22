import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import * as adminApi from '../services/adminApi';
import { getAuthErrorMessage } from '../utils/authErrors';
import type {
  AdminDashboard,
  AdminUserInput,
  BroadcastEntry,
  FailedLoginAttempt,
  SystemErrorEntry,
  SystemLogEntry,
} from '../types/admin';
import type { User, UserRole } from '../types/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  VETERINARIO: 'Veterinario',
  DUENO: 'Dueño',
  ADMIN: 'Administrador',
};

type AdminTab = 'resumen' | 'usuarios' | 'seguridad' | 'notificaciones' | 'observabilidad' | 'sistema';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'observabilidad', label: 'Observabilidad' },
  { id: 'sistema', label: 'Sistema' },
];

const emptyUserForm: AdminUserInput = {
  fullName: '',
  email: '',
  password: '',
  role: 'DUENO',
};

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([]);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [errors, setErrors] = useState<SystemErrorEntry[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<AdminUserInput>(emptyUserForm);
  const [userFormError, setUserFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const [broadcastForm, setBroadcastForm] = useState({
    subject: '',
    body: '',
    targetRole: 'ALL',
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, usersRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.listUsers(),
      ]);
      setDashboard(dash);
      setUsers(usersRes.users);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSecurity = useCallback(async () => {
    try {
      const res = await adminApi.getFailedLogins();
      setFailedLogins(res.attempts);
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }, [showError]);

  const loadObservability = useCallback(async () => {
    try {
      const [l, e] = await Promise.all([
        adminApi.getSystemLogs(40),
        adminApi.getSystemErrors(40),
      ]);
      setLogs(l.logs);
      setErrors(e.errors);
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }, [showError]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await adminApi.getNotificationHistory();
      setBroadcastHistory(res.history);
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }, [showError]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (tab === 'seguridad') loadSecurity();
    if (tab === 'observabilidad') loadObservability();
    if (tab === 'notificaciones') loadNotifications();
  }, [tab, loadSecurity, loadObservability, loadNotifications]);

  function openCreateUser() {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserFormError('');
    setShowUserForm(true);
  }

  function openEditUser(u: User) {
    setEditingUser(u);
    setUserForm({
      fullName: u.fullName,
      email: u.email,
      password: '',
      role: u.role,
    });
    setUserFormError('');
    setShowUserForm(true);
  }

  async function handleUserSubmit(e: FormEvent) {
    e.preventDefault();
    setUserFormError('');
    setSavingUser(true);
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, {
          fullName: userForm.fullName,
          role: userForm.role,
          ...(userForm.password ? { password: userForm.password } : {}),
        });
        showSuccess('Usuario actualizado');
      } else {
        if (!userForm.password) {
          setUserFormError('La contraseña es obligatoria');
          setSavingUser(false);
          return;
        }
        await adminApi.createUser(userForm);
        showSuccess('Usuario creado');
      }
      setShowUserForm(false);
      await loadCore();
    } catch (err) {
      setUserFormError(getAuthErrorMessage(err));
    } finally {
      setSavingUser(false);
    }
  }

  async function handleDeleteUser(u: User) {
    if (!confirm(`¿Eliminar a ${u.fullName}? Esta acción no se puede deshacer.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      showSuccess('Usuario eliminado');
      await loadCore();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }

  async function toggleActive(u: User) {
    try {
      await adminApi.setUserActive(u.id, u.active === false);
      showSuccess(u.active === false ? 'Cuenta activada' : 'Cuenta desactivada');
      await loadCore();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function toggleBlock(u: User) {
    const action = u.blocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`¿${action} a ${u.fullName}?`)) return;
    try {
      await adminApi.setUserBlocked(u.id, !u.blocked);
      showSuccess(u.blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
      await loadCore();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function handleForceLogout(u: User) {
    if (!confirm(`¿Forzar cierre de sesión de ${u.fullName}?`)) return;
    try {
      await adminApi.forceLogout(u.id);
      showSuccess('Sesiones invalidadas');
    } catch (err) {
      showError(getAuthErrorMessage(err));
    }
  }

  async function handleBroadcast(e: FormEvent) {
    e.preventDefault();
    setSendingBroadcast(true);
    try {
      const res = await adminApi.broadcastNotification(broadcastForm);
      showSuccess(`Enviado a ${res.broadcast.recipients} usuarios`);
      setBroadcastForm({ subject: '', body: '', targetRole: 'ALL' });
      await loadNotifications();
    } catch (err) {
      showError(getAuthErrorMessage(err));
    } finally {
      setSendingBroadcast(false);
    }
  }

  return (
    <AppShell title="Panel administrador">
      <div className="admin-page">
        <p className="admin-intro">
          Control central de VetCare: usuarios, RBAC, seguridad, notificaciones globales y
          observabilidad de microservicios (según arquitectura del proyecto).
        </p>

        <nav className="admin-tabs admin-tabs--wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="pet-loading">Cargando panel…</p>}

        {!loading && dashboard && tab === 'resumen' && (
          <>
            <section className="admin-stats">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Usuarios</span>
                <strong>{dashboard.users.total}</strong>
                <small>
                  {dashboard.users.active} activos · {dashboard.users.blocked} bloqueados
                </small>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Mascotas</span>
                <strong>{dashboard.pets}</strong>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Consultas médicas</span>
                <strong>{dashboard.clinicalRecords}</strong>
                <small>
                  {dashboard.recordsByStatus.SEGUIMIENTO ?? 0} seguimiento ·{' '}
                  {dashboard.recordsByStatus.URGENTE ?? 0} urgentes
                </small>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Recordatorios</span>
                <strong>{dashboard.reminders}</strong>
              </div>
              <div className="admin-stat-card admin-stat-card--warn">
                <span className="admin-stat-label">Logins fallidos (24h)</span>
                <strong>{dashboard.security.failedLogins24h}</strong>
              </div>
              <div className="admin-stat-card admin-stat-card--accent">
                <span className="admin-stat-label">Microservicios</span>
                <strong>
                  {dashboard.services.filter((s) => s.health === 'healthy').length}/
                  {dashboard.services.length}
                </strong>
                <small>healthy / total</small>
              </div>
            </section>

            <section className="admin-section">
              <h2>Estado de microservicios</h2>
              <ul className="admin-services">
                {dashboard.services.map((svc) => (
                  <li
                    key={svc.id}
                    className={`admin-service admin-service--${svc.status}`}
                  >
                    <div>
                      <strong>{svc.name}</strong>
                      <span className="admin-service-id">{svc.id}</span>
                    </div>
                    <span className="admin-service-meta">
                      :{svc.port} · {svc.online ? 'online' : 'offline'} ·{' '}
                      {svc.health || (svc.status === 'ok' ? 'healthy' : 'unhealthy')}
                    </span>
                    <span className={`admin-service-badge admin-service-badge--${svc.status}`}>
                      {svc.status === 'ok' ? 'Operativo' : 'Caído'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {!loading && tab === 'usuarios' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2>Gestión de usuarios</h2>
                <p className="admin-section-desc">
                  Crear, editar, eliminar, activar/desactivar y asignar roles (Veterinario, Dueño,
                  Admin).
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={openCreateUser}>
                + Nuevo usuario
              </button>
            </div>

            {showUserForm && (
              <form className="admin-user-form" onSubmit={handleUserSubmit}>
                <h3>{editingUser ? 'Editar usuario' : 'Crear usuario'}</h3>
                {userFormError && <p className="auth-error">{userFormError}</p>}
                <label>
                  Nombre completo
                  <input
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Correo
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                    disabled={Boolean(editingUser)}
                  />
                </label>
                <label>
                  {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    minLength={editingUser ? 0 : 6}
                    required={!editingUser}
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value as UserRole })
                    }
                  >
                    <option value="DUENO">Dueño de mascota</option>
                    <option value="VETERINARIO">Veterinario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                <div className="admin-user-form-actions">
                  <button type="submit" className="btn-primary" disabled={savingUser}>
                    {savingUser ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setShowUserForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="clinical-table-wrap">
              <table className="clinical-table admin-users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.blocked ? 'admin-row--blocked' : ''}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`admin-role admin-role--${u.role.toLowerCase()}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td>
                        {u.blocked && <span className="admin-badge admin-badge--danger">Bloqueado</span>}
                        {!u.blocked && u.active === false && (
                          <span className="admin-badge admin-badge--muted">Inactivo</span>
                        )}
                        {!u.blocked && u.active !== false && (
                          <span className="admin-badge admin-badge--ok">Activo</span>
                        )}
                      </td>
                      <td className="admin-users-actions">
                        <button type="button" className="btn-text" onClick={() => openEditUser(u)}>
                          Editar
                        </button>
                        {u.id !== currentUser?.id && (
                          <>
                            <button type="button" className="btn-text" onClick={() => toggleActive(u)}>
                              {u.active === false ? 'Activar' : 'Desactivar'}
                            </button>
                            <button type="button" className="btn-text" onClick={() => toggleBlock(u)}>
                              {u.blocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                            <button type="button" className="btn-text" onClick={() => handleForceLogout(u)}>
                              Cerrar sesión
                            </button>
                            <button
                              type="button"
                              className="btn-text btn-text--danger"
                              onClick={() => handleDeleteUser(u)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'seguridad' && (
          <section className="admin-section">
            <h2>Seguridad</h2>
            <p className="admin-section-desc">
              Intentos fallidos de login, bloqueo de cuentas sospechosas y cierre forzado de sesión
              (JWT invalidado).
            </p>
            <div className="clinical-table-wrap">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Correo</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {failedLogins.length === 0 && (
                    <tr>
                      <td colSpan={3}>Sin intentos fallidos registrados</td>
                    </tr>
                  )}
                  {failedLogins.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.at).toLocaleString('es-CO')}</td>
                      <td>{a.email}</td>
                      <td>
                        {a.reason === 'WRONG_PASSWORD' ? 'Contraseña incorrecta' : 'Correo desconocido'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="admin-hint">
              Para bloquear o cerrar sesión de un usuario, usa la pestaña <strong>Usuarios</strong>.
            </p>
          </section>
        )}

        {tab === 'notificaciones' && (
          <section className="admin-section">
            <h2>Notificaciones globales</h2>
            <form className="admin-user-form" onSubmit={handleBroadcast}>
              <label>
                Destinatarios
                <select
                  value={broadcastForm.targetRole}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })
                  }
                >
                  <option value="ALL">Todos los usuarios</option>
                  <option value="VETERINARIO">Solo veterinarios</option>
                  <option value="DUENO">Solo dueños</option>
                  <option value="ADMIN">Solo administradores</option>
                </select>
              </label>
              <label>
                Asunto
                <input
                  value={broadcastForm.subject}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, subject: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Mensaje
                <textarea
                  rows={4}
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  required
                />
              </label>
              <button type="submit" className="btn-primary" disabled={sendingBroadcast}>
                {sendingBroadcast ? 'Enviando…' : 'Enviar notificación global'}
              </button>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Historial de envíos</h3>
            <div className="clinical-table-wrap">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Asunto</th>
                    <th>Destino</th>
                    <th>Destinatarios</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcastHistory.length === 0 && (
                    <tr>
                      <td colSpan={5}>Sin envíos registrados</td>
                    </tr>
                  )}
                  {broadcastHistory.map((b) => (
                    <tr key={b.id}>
                      <td>{new Date(b.sentAt).toLocaleString('es-CO')}</td>
                      <td>{b.subject}</td>
                      <td>{b.targetRole}</td>
                      <td>{b.recipients}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            b.status === 'SENT' ? 'ok' : b.status === 'ERROR' ? 'danger' : 'muted'
                          }`}
                        >
                          {b.status === 'SENT' ? 'Enviado' : b.status === 'ERROR' ? 'Error' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'observabilidad' && (
          <section className="admin-section">
            <h2>Observabilidad</h2>
            <p className="admin-section-desc">Logs y errores del sistema (auditoría en memoria).</p>
            <h3>Logs recientes</h3>
            <ul className="admin-log-list">
              {logs.length === 0 && <li className="admin-log-empty">Sin logs</li>}
              {logs.map((l) => (
                <li key={l.id} className={`admin-log admin-log--${l.level}`}>
                  <time>{new Date(l.at).toLocaleString('es-CO')}</time>
                  <span className="admin-log-level">{l.level}</span>
                  <span>{l.message}</span>
                </li>
              ))}
            </ul>
            <h3>Errores recientes</h3>
            <ul className="admin-log-list">
              {errors.length === 0 && <li className="admin-log-empty">Sin errores</li>}
              {errors.map((e) => (
                <li key={e.id} className="admin-log admin-log--error">
                  <time>{new Date(e.at).toLocaleString('es-CO')}</time>
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && dashboard && tab === 'sistema' && (
          <>
            <section className="admin-section">
              <h2>Arquitectura del sistema</h2>
              <dl className="admin-arch">
                <div>
                  <dt>Estilo</dt>
                  <dd>{dashboard.architecture.style}</dd>
                </div>
                <div>
                  <dt>Comunicación</dt>
                  <dd>{dashboard.architecture.communication}</dd>
                </div>
                <div>
                  <dt>Repositorio</dt>
                  <dd>{dashboard.architecture.repository}</dd>
                </div>
              </dl>
            </section>
            <section className="admin-section">
              <h2>Atributos de calidad</h2>
              <ul className="admin-quality">
                {dashboard.architecture.qualityAttributes.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
            <section className="admin-section">
              <h2>Microservicios (ADR-001)</h2>
              <ul className="admin-ms-list">
                <li>
                  <strong>user-management</strong> — JWT, RBAC, administración
                </li>
                <li>
                  <strong>clinical-history</strong> — Mascotas e historial clínico
                </li>
                <li>
                  <strong>tracking-reminders</strong> — Recordatorios y alertas
                </li>
                <li>
                  <strong>storage-service</strong> — Archivos y respaldo
                </li>
                <li>
                  <strong>query-visualization</strong> — Dashboard y métricas
                </li>
                <li>
                  <strong>notification-service</strong> — Notificaciones y toasts
                </li>
              </ul>
              <p className="admin-config-note">
                Contratos OpenAPI en <code>shared/contracts/</code> · Docker en{' '}
                <code>infrastructure/docker-compose.yml</code>
              </p>
            </section>
          </>
        )}

        <Link to="/inicio" className="back-link admin-back">
          ← Volver al inicio
        </Link>
      </div>
    </AppShell>
  );
}
