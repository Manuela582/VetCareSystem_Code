const HTTP_MESSAGES: Record<number, string> = {
  400: 'Solicitud incorrecta. Revisa los datos ingresados.',
  401: 'No autorizado. Inicia sesión de nuevo.',
  403: 'No tienes permiso para esta acción.',
  404: 'Recurso no encontrado.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'Servicio no disponible temporalmente.',
  503: 'Servicio en mantenimiento.',
};

export type AuthErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NETWORK'
  | 'UNKNOWN';

export function getAuthErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function mapApiAuthError(status: number, body: { message?: string; code?: string }): Error {
  const code = body.code as AuthErrorCode | undefined;
  const msg = body.message || HTTP_MESSAGES[status] || 'Error en la solicitud';

  if (status === 401) {
    if (code === 'TOKEN_EXPIRED' || msg.toLowerCase().includes('expir')) {
      return Object.assign(new Error('Tu sesión ha expirado. Inicia sesión de nuevo.'), {
        code: 'TOKEN_EXPIRED' as const,
      });
    }
    return Object.assign(new Error(msg), { code: 'UNAUTHORIZED' as const });
  }

  if (status === 403) {
    return Object.assign(new Error(msg), { code: 'FORBIDDEN' as const });
  }

  return new Error(msg);
}
