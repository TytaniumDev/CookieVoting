/**
 * Props for the AlertModal component
 */
interface AlertModalProps {
  /** The message to display in the modal */
  message: string;
  /** The type of alert, determines styling and default title */
  type?: 'success' | 'error' | 'info';
  /** Callback function called when the modal is closed */
  onClose: () => void;
  /** Optional custom title. If not provided, a default title is used based on type */
  title?: string;
}

/**
 * AlertModal - A modal component for displaying alert messages to users.
 *
 * This component displays a modal overlay with a message, title, and close button.
 * It supports different alert types (success, error, info) which determine the
 * styling and default title. The modal can be closed by clicking the OK button
 * or clicking outside the modal (on the overlay).
 *
 * @example
 * ```tsx
 * <AlertModal
 *   message="Operation completed successfully!"
 *   type="success"
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element containing the modal
 */
export function AlertModal({ message, type = 'info', onClose, title }: AlertModalProps) {
  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      default:
        return 'Information';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-[#28a745]';
      case 'error':
        return 'text-[#dc3545]';
      default:
        return 'text-[#f8fafc]';
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="bg-[#1a2b47] text-[#f8fafc] p-8 rounded-lg max-w-[400px] w-[90%] shadow-md border border-white/10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        <h3 id="alert-modal-title" className={`m-0 mb-4 text-2xl ${getTitleColor()}`}>
          {getTitle()}
        </h3>
        <p className="m-0 mb-6 text-[#cbd5e1] whitespace-pre-line">{message}</p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-base cursor-pointer bg-blue-600 text-white border-none rounded transition-colors hover:bg-[#0056b3] focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
