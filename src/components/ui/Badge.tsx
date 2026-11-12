import React from 'react';
import { cx } from './cx.ts';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  brand: 'bg-brand-50 text-brand-800 border-brand-100',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  info: 'bg-info-50 text-info-700 border-info-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', icon, className, children, ...rest }) => (
  <span
    className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', TONE[tone], className)}
    {...rest}
  >
    {icon}
    {children}
  </span>
);
