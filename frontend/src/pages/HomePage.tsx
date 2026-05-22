import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  VETERINARIO: 'Veterinario',
  DUENO: 'Dueño de mascota',
  ADMIN: 'Administrador',
};

export function HomePage() {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  return (
    <AppShell title={`Hola, ${user.fullName}`}>
      <p className="home-role">
        Rol: <strong>{roleLabels[user.role]}</strong>
      </p>
      <p className="home-email">{user.email}</p>

      <section className="home-cards">
        <h2>Accesos según tu rol</h2>
        <ul className="home-links">
          <li>
            <Link to="/mascotas">Gestión de mascotas e historial clínico</Link>
          </li>
          {(hasRole('VETERINARIO', 'ADMIN')) && (
            <li>
              <Link to="/panel/veterinario">Panel veterinario</Link>
            </li>
          )}
          {(hasRole('DUENO', 'ADMIN')) && (
            <li>
              <Link to="/panel/dueno">Panel dueño de mascota</Link>
            </li>
          )}
          {hasRole('ADMIN') && (
            <li>
              <Link to="/admin">Panel administrador</Link>
            </li>
          )}
        </ul>
        <p className="home-hint">
          Las rutas bloqueadas por rol te llevarán a &quot;Acceso denegado&quot;.
          La sesión se cierra sola cuando el JWT expira.
        </p>
      </section>
    </AppShell>
  );
}
