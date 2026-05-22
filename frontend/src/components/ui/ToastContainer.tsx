import { useNotifications } from '../../context/NotificationContext';

export function ToastContainer() {
  const { toasts } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
