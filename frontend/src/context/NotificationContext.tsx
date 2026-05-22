import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as notificationsApi from '../services/notificationsApi';
import { useAuth } from './AuthContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface NotificationContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  notifications: notificationsApi.AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<notificationsApi.AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const showSuccess = useCallback((m: string) => showToast('success', m), [showToast]);
  const showError = useCallback((m: string) => showToast('error', m), [showToast]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.listNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unread);
    } catch {
      /* silencioso si el servicio no está arriba */
    }
  }, [isAuthenticated]);

  const markRead = useCallback(
    async (id: string) => {
      await notificationsApi.markAsRead(id);
      await refreshNotifications();
    },
    [refreshNotifications],
  );

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    await refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (isAuthenticated) refreshNotifications();
  }, [isAuthenticated, refreshNotifications]);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      showSuccess,
      showError,
      notifications,
      unreadCount,
      refreshNotifications,
      markRead,
      markAllRead,
    }),
    [
      toasts,
      showToast,
      showSuccess,
      showError,
      notifications,
      unreadCount,
      refreshNotifications,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications requiere NotificationProvider');
  return ctx;
}
