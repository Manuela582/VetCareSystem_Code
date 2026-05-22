import { mapApiAuthError } from '../utils/authErrors';

type ApiErrorBody = { message?: string; code?: string };

let getToken: (() => string | null) | null = null;
let onUnauthorized: ((code?: string) => void) | null = null;
let onApiError: ((message: string, status: number) => void) | null = null;

const RETRY_STATUSES = new Set([500, 502, 503]);

export function configureApiClient(options: {
  getToken: () => string | null;
  onUnauthorized: (code?: string) => void;
  onApiError?: (message: string, status: number) => void;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
  onApiError = options.onApiError ?? null;
}

async function fetchOnce(path: string, options: RequestInit, headers: Record<string, string>) {
  return fetch(`/api/v1${path}`, { ...options, headers });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; retries?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth) {
    // Primero intenta getToken (configurado por ApiBridge), luego lee localStorage directamente
    const token = (getToken ? getToken() : null) ?? localStorage.getItem('vetcare_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const maxRetries = options.retries ?? 1;
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastRes = await fetchOnce(path, options, headers);
    } catch {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      const msg = 'No se pudo conectar con el servidor.';
      onApiError?.(msg, 0);
      throw Object.assign(new Error(msg), { code: 'NETWORK' });
    }

    if (lastRes.ok || !RETRY_STATUSES.has(lastRes.status) || attempt === maxRetries) break;
    await new Promise((r) => setTimeout(r, 600));
  }

  const res = lastRes!;
  const data = (await res.json().catch(() => ({}))) as ApiErrorBody;

  if (!res.ok) {
    const isClinical =
      path.startsWith('/pets') ||
      path.startsWith('/patients') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/reminders');
    if (res.status >= 502 || (res.status === 500 && !data.message)) {
      const hint = isClinical
        ? ' Ejecuta: npm run dev (todos los servicios).'
        : ' Ejecuta: npm run dev';
      const msg = `No se pudo conectar con el servidor.${hint}`;
      onApiError?.(msg, res.status);
      throw Object.assign(new Error(msg), { code: 'NETWORK' });
    }
    const err = mapApiAuthError(res.status, data);
    onApiError?.(err.message, res.status);
    if (res.status === 401 && onUnauthorized) onUnauthorized(data.code);
    throw err;
  }

  return data as T;
}
