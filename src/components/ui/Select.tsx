import React from 'react';
import { Field, fieldControlClass, describedBy } from './Field.tsx';
import { cx } from './cx.ts';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, options, hint, error, className, ...rest },
  ref
) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(fieldControlClass(Boolean(error)), className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
