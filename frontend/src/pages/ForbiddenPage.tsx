import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  VETERINARIO: 'Veterinario',
  DUENO: 'Dueño de mascota',
  ADMIN: 'Administrador',
};

export function ForbiddenPage() {
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as { userRole?: string } | null;

  const currentRole = user?.role || state?.userRole;

  return (
    <div className="forbidden-page">
      <h1>Acceso denegado</h1>
      <p>No tienes permiso para ver esta sección.</p>
      {currentRole && (
        <p className="forbidden-role">
          Tu rol actual: <strong>{roleLabels[currentRole as keyof typeof roleLabels]}</strong>
        </p>
      )}
      <Link to="/inicio" className="btn-primary forbidden-btn">
        Volver al inicio
      </Link>
    </div>
  );
}
