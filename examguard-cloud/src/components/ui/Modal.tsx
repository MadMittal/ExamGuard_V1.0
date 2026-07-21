'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// =============================================================================
// Modal Component
// =============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on Escape key (native dialog behavior) or overlay click
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOverlay && e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`
        ${maxWidthStyles[maxWidth]} w-[calc(100%-2rem)]
        bg-[var(--panel)] rounded-[var(--radius-lg)]
        border border-[var(--line)]
        shadow-[var(--shadow-xl)]
        p-0 m-auto
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
        animate-fade-in
      `}
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="p-6">
        {/* Header */}
        {(title || true) && (
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              {title && (
                <h2 className="text-[17px] font-semibold text-[var(--ink)] m-0">{title}</h2>
              )}
              {description && (
                <p className="text-[13px] text-[var(--muted)] mt-1 m-0">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="
                flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5
                text-[var(--muted)] hover:text-[var(--ink)]
                rounded-[var(--radius-sm)]
                hover:bg-[var(--soft)]
                transition-colors duration-150
                cursor-pointer border-none bg-transparent
              "
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </dialog>
  );
}

// Modal Footer sub-component for action buttons
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--line)] ${className}`}>
      {children}
    </div>
  );
}
