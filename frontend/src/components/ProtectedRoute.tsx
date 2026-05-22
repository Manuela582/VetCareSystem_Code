import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import type { ReactNode } from 'react';

/*
 * Escenario 1 (pantalla) — Antes de mostrar historial u otras páginas privadas.
 * Si no hay sesión guardada, redirige a login (solicita autenticación al usuario).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, authNotice } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // BLOQUEO Esc.1: no autenticado → no ve la página; va a /login con mensaje.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: authNotice || 'Debes iniciar sesión para continuar.' }}
      />
    );
  }

  // PERMITIDO: ya inició sesión → muestra la ruta (ej. historial).
  return <>{children}</>;
}
