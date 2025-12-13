import { useAppContext } from '../context/AppContext.jsx';

const typeStyles = {
  info: 'border-primary text-slate-700',
  success: 'border-green-500 text-green-700',
  alert: 'border-red-500 text-red-600'
};

const NotificationStack = () => {
  const { toasts, dismissToast } = useAppContext();

  if (!toasts.length) return null;

  const icons = {
    info: 'ℹ️',
    success: '🎉',
    alert: '⚠️'
  };

  return (
    <div className="fixed top-20 right-4 z-[100] flex w-80 flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#1e293b] border border-slate-700/50 text-white rounded-xl shadow-2xl p-4 flex items-start gap-4 animate-in slide-in-from-right duration-300"
        >
          <div className="text-2xl shrink-0 select-none">
            {icons[toast.type] || '✨'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <p className="font-bold text-sm leading-tight">{toast.title}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-500 hover:text-white transition-colors -mt-1 -mr-1 p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
