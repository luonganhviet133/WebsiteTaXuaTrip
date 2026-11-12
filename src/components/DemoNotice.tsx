import React from 'react';
import { Info } from 'lucide-react';

interface DemoNoticeProps {
  children: React.ReactNode;
  /** Dùng trên nền tối (modal nền slate-900). */
  dark?: boolean;
  className?: string;
}

/** Nhãn "Bản demo" cho tính năng còn mô phỏng, chưa xử lý thật ở server. */
export const DemoNotice: React.FC<DemoNoticeProps> = ({ children, dark = false, className = '' }) => (
  <div
    role="note"
    className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${
      dark ? 'border-amber-400/40 bg-amber-400/10 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'
    } ${className}`}
  >
    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div>
      <span className="font-bold">Bản demo: </span>
      {children}
    </div>
  </div>
);
