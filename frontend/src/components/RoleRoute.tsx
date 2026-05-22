import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { ReactNode } from 'react';
import type { UserRole } from '../types/auth';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: 'Debes iniciar sesión.' }} />;
  }

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
