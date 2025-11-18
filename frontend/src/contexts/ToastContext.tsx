import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdSeq = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = toastIdSeq++;
      const item: ToastItem = { id, message, type, duration };
      setToasts((prev) => [...prev, item]);
      if (duration && duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const value: ToastContextValue = useMemo(
    () => ({
      toasts,
      show,
      success: (m, d) => show(m, 'success', d),
      error: (m, d) => show(m, 'error', d),
      info: (m, d) => show(m, 'info', d),
      warning: (m, d) => show(m, 'warning', d),
      dismiss,
    }),
    [toasts, show, dismiss]
  );

  // Listen for global toast events from non-React modules (e.g., api.ts)
  useEffect(() => {
    type ToastEventDetail = { message: string; type?: ToastType; duration?: number };
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ToastEventDetail>;
      if (ce.detail?.message) {
        show(ce.detail.message, ce.detail.type, ce.detail.duration);
      }
    };
    window.addEventListener('app:toast', handler as EventListener);
    return () => window.removeEventListener('app:toast', handler as EventListener);
  }, [show]);

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
