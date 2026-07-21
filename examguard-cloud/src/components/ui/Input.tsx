import { forwardRef, type InputHTMLAttributes } from 'react';

// =============================================================================
// Input Component
// =============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[12px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 px-3 text-[15px]
            bg-[var(--panel)] text-[var(--ink)]
            border rounded-[var(--radius-sm)] outline-none
            transition-all duration-150
            placeholder:text-[var(--subtle)]
            focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-alpha)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--danger)]' : 'border-[var(--line)]'}
            ${className}
          `.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-[12px] text-[var(--danger)] mt-1 m-0"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-[12px] text-[var(--muted)] mt-1 m-0"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input, type InputProps };
