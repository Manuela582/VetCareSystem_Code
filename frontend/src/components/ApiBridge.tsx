import { useEffect } from 'react';
import { configureApiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function ApiBridge() {
  const { token, logout } = useAuth();
  const { showError } = useNotifications();

  useEffect(() => {
    configureApiClient({
      getToken: () => token ?? localStorage.getItem('vetcare_token'),
      onUnauthorized: (code) => {
        logout(
          code === 'TOKEN_EXPIRED'
            ? 'Tu sesión ha expirado. Inicia sesión de nuevo.'
            : 'Tu sesión no es válida.',
        );
      },
      onApiError: (msg, status) => {
        if (status !== 401 && !msg.includes('npm run dev')) showError(msg);
      },
    });
  }, [token, logout, showError]);

  return null;
}
