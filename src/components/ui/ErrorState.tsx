import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.tsx';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Có lỗi xảy ra', message, onRetry }) => (
  <div role="alert" className="flex flex-col items-center gap-2 rounded-card border border-danger-200 bg-danger-50 px-4 py-8 text-center">
    <AlertTriangle className="h-8 w-8 text-danger-600" aria-hidden="true" />
    <p className="text-base font-semibold text-danger-700">{title}</p>
    <p className="max-w-sm text-sm text-slate-700">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
        Thử lại
      </Button>
    )}
  </div>
);
