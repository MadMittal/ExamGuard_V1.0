import { forwardRef, type ButtonHTMLAttributes } from 'react';

// =============================================================================
// Button Component
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand)] text-white border-transparent hover:bg-[var(--brand-dark)] active:bg-[var(--brand-dark)]',
  secondary:
    'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--soft)] active:bg-[var(--soft)]',
  danger:
    'bg-[var(--danger)] text-white border-transparent hover:bg-[#9f1239] active:bg-[#9f1239]',
  ghost:
    'bg-transparent text-[var(--brand)] border-transparent hover:bg-[var(--brand-alpha)] active:bg-[var(--brand-alpha)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-semibold
          border rounded-[var(--radius-sm)] cursor-pointer
          transition-colors duration-150 ease-in-out
          focus-ring
          disabled:cursor-not-allowed disabled:opacity-55
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button, type ButtonProps };
