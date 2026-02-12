import { useRef, useEffect } from 'react';
import { cn } from '../../../lib/cn';

export interface ConfirmationModalProps {
  /** Title of the modal */
  title: string;
  /** Message body */
  message: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Whether the action is destructive (renders red button) */
  isDestructive?: boolean;
  /** Whether the modal is open */
  isOpen: boolean;
}

export function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  isOpen,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        className="bg-surface-secondary border border-surface-tertiary rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 scale-100 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
      >
        <h3 id="modal-title" className="text-lg font-semibold text-white">
          {title}
        </h3>

        <p id="modal-desc" className="text-gray-300 text-sm">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-surface-tertiary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-secondary',
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
