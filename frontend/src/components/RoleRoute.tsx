import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { ReactNode } from 'react';
import type { UserRole } from '../types/auth';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

/*
 * Escenario 1 (pantalla) — Comprueba rol además de sesión.
 * Paso 1: sin sesión → login. Paso 2: sesión pero rol incorrecto → acceso denegado.
 */
export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // BLOQUEO Esc.1: pide iniciar sesión (misma idea que authMiddleware en el API).
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: 'Debes iniciar sesión.' }} />;
  }

  // BLOQUEO: autenticado pero su rol no está en la lista de esta ruta.
  if (!hasRole(...allowedRoles)) {
    return (
      <Navigate
        to="/sin-permiso"
        replace
        state={{
          requiredRoles: allowedRoles,
          userRole: user?.role,
        }}
      />
    );
  }

  return <>{children}</>;
}
