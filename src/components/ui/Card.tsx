import React from 'react';
import { cx } from './cx.ts';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({ padded = true, className, children, ...rest }) => (
  <div className={cx('rounded-card border border-slate-200 bg-white shadow-sm', padded && 'p-4 md:p-5', className)} {...rest}>
    {children}
  </div>
);
