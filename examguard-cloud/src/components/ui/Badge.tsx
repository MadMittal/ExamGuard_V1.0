import type { ReactNode } from 'react';

// =============================================================================
// Badge Component
// =============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--soft)] text-[var(--muted)] border-[var(--line)]',
  success: 'bg-[var(--success-light)] text-[var(--success)] border-[#bbf7d0]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[#fde68a]',
  danger: 'bg-[var(--danger-light)] text-[var(--danger)] border-[#fecdd3]',
  info: 'bg-[var(--brand-light)] text-[var(--brand)] border-[#bfdbfe]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--muted)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger: 'bg-[var(--danger)]',
  info: 'bg-[var(--brand)]',
};

export function Badge({ children, variant = 'default', dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        text-[11px] font-semibold uppercase tracking-wider leading-5
        border rounded-[var(--radius-full)]
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

export type { BadgeVariant, BadgeProps };
