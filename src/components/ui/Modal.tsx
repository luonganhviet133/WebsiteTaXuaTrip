import React, { useId } from 'react';
import { X } from 'lucide-react';
import { useDialog } from './useDialog.ts';
import { cx } from './cx.ts';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

/** Hộp thoại giữa màn hình, dùng cho thao tác ngắn (xác nhận, form nhỏ). */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, footer, size = 'md', children }) => {
  const titleId = useId();
  const panelRef = useDialog(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-[90vh] w-full flex-col rounded-modal bg-white shadow-xl outline-none',
          WIDTH[size]
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4 text-sm text-slate-700">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
};
