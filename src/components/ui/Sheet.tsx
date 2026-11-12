import React, { useId } from 'react';
import { X } from 'lucide-react';
import { useDialog } from './useDialog.ts';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Bảng trượt từ đáy màn hình trên điện thoại; từ cỡ md trở lên hiện như hộp thoại giữa màn hình.
 * Dùng cho bộ lọc, chọn ngày/khách, chi tiết giá.
 */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, footer, children }) => {
  const titleId = useId();
  const panelRef = useDialog(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-modal bg-white shadow-xl outline-none md:max-w-lg md:rounded-modal"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 md:hidden" aria-hidden="true" />
        <header className="flex items-center justify-between gap-3 px-5 py-3">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-control text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pb-4 text-sm text-slate-700">{children}</div>
        {footer && (
          <footer className="border-t border-slate-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
