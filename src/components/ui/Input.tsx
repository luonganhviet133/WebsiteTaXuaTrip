import React from 'react';
import { Field, fieldControlClass, describedBy } from './Field.tsx';
import { cx } from './cx.ts';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, className, ...rest },
  ref
) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(fieldControlClass(Boolean(error)), className)}
        {...rest}
      />
    </Field>
  );
});
