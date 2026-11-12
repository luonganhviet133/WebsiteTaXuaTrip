import React from 'react';

export const fieldControlClass = (invalid: boolean) =>
  [
    'w-full min-h-11 rounded-control border bg-white px-3 text-base text-slate-900 placeholder:text-slate-400',
    'disabled:bg-slate-100 disabled:text-slate-500',
    invalid ? 'border-danger-600' : 'border-slate-300 focus:border-brand-700',
  ].join(' ');

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** Khung nhãn + gợi ý + lỗi dùng chung cho Input và Select. */
export const Field: React.FC<FieldProps> = ({ id, label, hint, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-slate-700">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="text-xs text-danger-700">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="text-xs text-slate-500">
        {hint}
      </p>
    ) : null}
  </div>
);

export const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;
