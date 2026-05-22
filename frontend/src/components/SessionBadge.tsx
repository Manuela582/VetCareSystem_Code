import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTokenRemainingMs } from '../utils/jwt';

function formatRemaining(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return 'menos de 1 min';
}

export function SessionBadge() {
  const { token, sessionExpiresAt } = useAuth();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!token) return;

    const tick = () => setRemaining(getTokenRemainingMs(token));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [token, sessionExpiresAt]);

  if (!token || remaining <= 0) return null;

  const isLow = remaining < 5 * 60 * 1000;

  return (
    <span className={`session-badge ${isLow ? 'session-badge--warn' : ''}`}>
      Sesión: {formatRemaining(remaining)}
    </span>
  );
}
