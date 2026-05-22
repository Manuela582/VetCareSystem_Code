import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../services/authApi';
import type { User, UserRole } from '../types/auth';
import { getTokenExpiresAtMs, getTokenRemainingMs, isTokenExpired } from '../utils/jwt';

const TOKEN_KEY = 'vetcare_token';
const USER_KEY = 'vetcare_user';
const EXPIRES_KEY = 'vetcare_expires_at';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authNotice: string | null;
  sessionExpiresAt: number | null;
  login: (token: string, user: User, expiresAt: number) => void;
  logout: (notice?: string) => void;
  clearAuthNotice: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored() {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY),
      user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null,
      expiresAt: Number(localStorage.getItem(EXPIRES_KEY)) || null,
    };
  } catch {
    return { token: null, user: null, expiresAt: null };
  }
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [token, setToken] = useState<string | null>(stored.token);
  const [user, setUser] = useState<User | null>(stored.user);
  const [expiresAt, setExpiresAt] = useState<number | null>(stored.expiresAt);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback((notice?: string) => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    clearStorage();
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    if (notice) setAuthNotice(notice);
  }, []);

  const scheduleAutoLogout = useCallback(
    (jwt: string) => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

      const remaining = getTokenRemainingMs(jwt);
      if (remaining <= 0) {
        logout('Tu sesión ha expirado. Inicia sesión de nuevo.');
        return;
      }

      expiryTimerRef.current = setTimeout(() => {
        logout('Tu sesión ha expirado. Inicia sesión de nuevo.');
      }, remaining);
    },
    [logout],
  );

  const persistSession = useCallback(
    (newToken: string, newUser: User, newExpiresAt: number) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(EXPIRES_KEY, String(newExpiresAt));
      setToken(newToken);
      setUser(newUser);
      setExpiresAt(newExpiresAt);
      setAuthNotice(null);
      scheduleAutoLogout(newToken);
    },
    [scheduleAutoLogout],
  );

  const login = useCallback(
    (newToken: string, newUser: User, newExpiresAt: number) => {
      persistSession(newToken, newUser, newExpiresAt);
    },
    [persistSession],
  );

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  /* ApiClient se configura en ApiBridge (con toasts) */

  useEffect(() => {
    async function restoreSession() {
      const saved = loadStored();

      if (!saved.token) {
        setIsLoading(false);
        return;
      }

      if (isTokenExpired(saved.token)) {
        clearStorage();
        setAuthNotice('Tu sesión ha expirado. Inicia sesión de nuevo.');
        setIsLoading(false);
        return;
      }

      try {
        setToken(saved.token);
        const { user: freshUser } = await authApi.getMe();
        const exp =
          saved.expiresAt || getTokenExpiresAtMs(saved.token) || Date.now() + 3600000;
        persistSession(saved.token, freshUser, exp);
      } catch {
        clearStorage();
        setToken(null);
        setUser(null);
        setExpiresAt(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
    // Solo al montar: restaurar sesión desde localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token || isLoading) return;

    checkIntervalRef.current = setInterval(() => {
      if (isTokenExpired(token)) {
        logout('Tu sesión ha expirado. Inicia sesión de nuevo.');
      }
    }, 30_000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [token, isLoading, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user && !isTokenExpired(token)),
      isLoading,
      authNotice,
      sessionExpiresAt: expiresAt,
      login,
      logout,
      clearAuthNotice,
      hasRole,
    }),
    [
      user,
      token,
      expiresAt,
      isLoading,
      authNotice,
      login,
      logout,
      clearAuthNotice,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
