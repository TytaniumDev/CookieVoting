import styles from './AlertModal.module.css';

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
      className={styles.modalOverlay}
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        <h3
          id="alert-modal-title"
          className={styles[`title${type.charAt(0).toUpperCase() + type.slice(1)}`]}
        >
          {getTitle()}
        </h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalButton}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
