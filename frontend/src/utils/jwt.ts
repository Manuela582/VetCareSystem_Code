import type { UserRole } from '../types/auth';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiresAtMs(token: string): number | null {
  const payload = parseJwt(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isTokenExpired(token: string): boolean {
  const expiresAt = getTokenExpiresAtMs(token);
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

export function getTokenRemainingMs(token: string): number {
  const expiresAt = getTokenExpiresAtMs(token);
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - Date.now());
}
