import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { isDark } = useTheme();
  const recentToastsRef = useRef(new Map());

  // Dismiss a specific toast
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Central dispatch with deduplication to prevent duplicate notifications
  const addToast = useCallback((type, message, options = {}) => {
    if (!message) return null;

    const dedupeKey = `${type}:${message}`;
    const now = Date.now();
    const lastSeen = recentToastsRef.current.get(dedupeKey);

    // Prevent identical notification within 2 seconds
    if (lastSeen && now - lastSeen < 2000) {
      return null;
    }
    recentToastsRef.current.set(dedupeKey, now);

    const id = ++toastIdCounter;
    const duration = options.duration !== undefined ? options.duration : 4000;

    const newToast = {
      id,
      type, // 'success' | 'error' | 'warning' | 'info'
      message,
      title: options.title || null,
      duration,
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  const toast = {
    success: (msg, opts) => addToast('success', msg, opts),
    error: (msg, opts) => addToast('error', msg, opts),
    warning: (msg, opts) => addToast('warning', msg, opts),
    info: (msg, opts) => addToast('info', msg, opts),
    dismiss: dismissToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Viewport (Quiet-Luxury Styling) */}
      <aside
        aria-live="polite"
        aria-atomic="true"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-[90vw] sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          const accentColor = isSuccess
            ? '#8fb39a'
            : isError
            ? '#d97070'
            : isWarning
            ? '#d4a359'
            : '#c9b27c';

          const IconComponent = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : isWarning
            ? AlertTriangle
            : Info;

          return (
            <div
              key={t.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-200 ${
                isDark
                  ? 'bg-[#17171a]/95 backdrop-blur-md border-[#26262b] text-[#e8e8ea]'
                  : 'bg-white/95 backdrop-blur-md border-[#e5e3dc] text-[#18181b]'
              }`}
              style={{ borderLeftColor: accentColor, borderLeftWidth: '4px' }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                    {t.title}
                  </h4>
                )}
                <p className="text-xs font-medium leading-relaxed break-words">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback safe dummy logger if provider not yet mounted
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.error('[Toast Error]:', msg),
      warning: (msg) => console.warn('[Toast Warning]:', msg),
      info: (msg) => console.info('[Toast Info]:', msg),
      dismiss: () => {},
    };
  }
  return context;
}

