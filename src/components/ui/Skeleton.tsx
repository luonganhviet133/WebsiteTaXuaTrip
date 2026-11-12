import React from 'react';
import { cx } from './cx.ts';

/** Khung xương khi đang tải. Đặt kích thước bằng className, ví dụ "h-4 w-32". */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden="true" className={cx('animate-pulse rounded-control bg-slate-200', className)} />
);
