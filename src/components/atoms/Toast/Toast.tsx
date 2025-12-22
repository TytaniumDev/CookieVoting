import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, duration = 3000, onClose, type = 'info' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      <div className={styles.message}>{message}</div>
    </div>
  );
}
