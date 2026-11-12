import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  ghost: 'text-brand-800 hover:bg-brand-50',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, type = 'button', className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
