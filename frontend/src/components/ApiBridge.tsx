import { useEffect } from 'react';
import { configureApiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { isTokenExpired } from '../utils/jwt';

export function ApiBridge() {
  const { token, logout } = useAuth();
  const { showError } = useNotifications();

  useEffect(() => {
    configureApiClient({
      getToken: () => token ?? localStorage.getItem('vetcare_token'),

      onUnauthorized: (code) => {
        const stored = localStorage.getItem('vetcare_token');

        // Si el token existe y NO está expirado, el 401 probablemente viene
        // de un endpoint que no aplica al rol del usuario (comportamiento del backend).
        // No cerramos sesión en ese caso para no interrumpir la navegación.
        if (stored && !isTokenExpired(stored) && code !== 'TOKEN_EXPIRED') return;

        logout(
          code === 'TOKEN_EXPIRED'
            ? 'Tu sesión ha expirado. Inicia sesión de nuevo.'
            : undefined,
        );
      },

      onApiError: (msg, status) => {
        // 401 y 403 se manejan silenciosamente (inline o ignorados).
        if (status !== 401 && status !== 403 && !msg.includes('npm run dev')) {
          showError(msg);
        }
      },
    });
  }, [token, logout, showError]);

  return null;
}
