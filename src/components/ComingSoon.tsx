/**
 * R4 — Khối "Sắp ra mắt" theo Design System (thẻ ComingSoon): nói thật tính năng chưa dùng được
 * và việc người dùng làm được ngay. Nội dung lấy từ src/config/features.ts.
 */
import React, { useEffect, useRef } from 'react';
import { Lock, X } from 'lucide-react';
import { FEATURES, type FeatureKey } from '../config/features.ts';

export interface ComingSoonAction {
  label: string;
  onClick: () => void;
}

export const ComingSoonBadge: React.FC<{ id?: string; className?: string }> = ({ id, className = '' }) => (
  <span id={id} className={`inline-flex items-center px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-bold ${className}`}>
    Sắp ra mắt
  </span>
);

const Body: React.FC<{ feature: FeatureKey; actions?: ComingSoonAction[]; headingId: string; as?: 'h2' | 'h3' }> = ({ feature, actions = [], headingId, as = 'h2' }) => {
  const f = FEATURES[feature];
  const H = as;
  return (
    <>
      <Lock className="w-5 h-5 text-sky-700" aria-hidden="true" />
      <H id={headingId} className="text-base font-bold text-slate-900">
        {f.title}
      </H>
      <p className="text-sm text-slate-600">{f.note}</p>
      <ComingSoonBadge />
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={
                i === 0
                  ? 'inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-sm font-bold shadow-md cursor-pointer'
                  : 'inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-white border border-slate-500 text-slate-900 text-sm font-bold cursor-pointer'
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

/** Khối thay cho cả một khu vực/màn chưa xong. */
export const ComingSoon: React.FC<{ feature: FeatureKey; actions?: ComingSoonAction[]; className?: string }> = ({ feature, actions, className = '' }) => (
  <section
    aria-labelledby={`soon-${feature}`}
    data-feature-locked={feature}
    className={`flex flex-col items-start gap-2 p-4 sm:p-6 rounded-2xl border border-dashed border-slate-500 bg-slate-100 ${className}`}
  >
    <Body feature={feature} actions={actions} headingId={`soon-${feature}`} />
  </section>
);

/** Hộp thoại "Sắp ra mắt" mở từ các nút dẫn tới tính năng chưa xong. Esc để đóng, tiêu điểm vào nút đóng. */
export const ComingSoonModal: React.FC<{ feature: FeatureKey; onClose: () => void; actions?: ComingSoonAction[] }> = ({ feature, onClose, actions }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`soon-modal-${feature}`}
        data-feature-locked={feature}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="flex justify-end px-3 pt-3">
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng" className="w-11 h-11 rounded-full text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col items-start gap-2 px-6 pb-6">
          <Body
            feature={feature}
            headingId={`soon-modal-${feature}`}
            actions={actions?.map((a) => ({ ...a, onClick: () => { onClose(); a.onClick(); } }))}
          />
        </div>
      </div>
    </div>
  );
};
