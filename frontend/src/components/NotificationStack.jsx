import { useAppContext } from '../context/AppContext.jsx';

const typeStyles = {
  info: 'border-primary text-slate-700',
  success: 'border-green-500 text-green-700',
  alert: 'border-red-500 text-red-600'
};

const NotificationStack = () => {
  const { toasts, dismissToast } = useAppContext();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-effect-light border-l-4 ${typeStyles[toast.type] || typeStyles.info} p-4 shadow-lg pointer-events-auto`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">{toast.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line">{toast.message}</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar notificación"
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
              onClick={() => dismissToast(toast.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
