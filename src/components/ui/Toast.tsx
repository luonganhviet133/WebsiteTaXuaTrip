import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { toastReducer, type ToastTone } from './toastStore.ts';
import { cx } from './cx.ts';

const DURATION_MS = 4000;

const TONE: Record<ToastTone, { box: string; icon: React.ReactNode }> = {
  success: { box: 'border-success-200 bg-success-50 text-success-700', icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> },
  info: { box: 'border-info-200 bg-info-50 text-info-700', icon: <Info className="h-5 w-5" aria-hidden="true" /> },
  warning: { box: 'border-warning-200 bg-warning-50 text-warning-700', icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" /> },
  danger: { box: 'border-danger-200 bg-danger-50 text-danger-700', icon: <XCircle className="h-5 w-5" aria-hidden="true" /> },
};

type ShowToast = (message: string, tone?: ToastTone) => void;
const ToastContext = createContext<ShowToast | null>(null);

/**
 * Bọc ứng dụng để dùng useToast(). Chỉ báo "thành công" sau khi server đã trả kết quả thật.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const show = useCallback<ShowToast>(
    (message, tone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      dispatch({ type: 'add', toast: { id, tone, message } });
      setTimeout(() => remove(id), DURATION_MS);
    },
    [remove]
  );
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-auto md:right-4 md:top-4 md:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'danger' ? 'alert' : 'status'}
            className={cx('pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-card border px-4 py-3 text-sm shadow-lg', TONE[t.tone].box)}
          >
            {TONE[t.tone].icon}
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => remove(t.id)} aria-label="Đóng thông báo" className="-m-1 p-1 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải dùng bên trong <ToastProvider>');
  return ctx;
}
