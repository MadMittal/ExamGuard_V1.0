import type { HTMLAttributes, ReactNode } from 'react';

// =============================================================================
// Card Component
// =============================================================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
  lg: 'shadow-[var(--shadow-lg)]',
};

export function Card({
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--panel)] rounded-[var(--radius-md)]
        ${border ? 'border border-[var(--line)]' : ''}
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header sub-component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`} {...props}>
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">{title}</h3>
        {description && (
          <p className="text-[13px] text-[var(--muted)] mt-1 m-0">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
