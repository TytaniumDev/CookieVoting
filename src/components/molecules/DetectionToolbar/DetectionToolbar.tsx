import styles from './DetectionToolbar.module.css';

export interface DetectionToolbarProps {
    /** Number of detections */
    detectionCount: number;
    /** Whether regeneration is in progress */
    isRegenerating: boolean;
    /** Whether add mode is active */
    isAddMode: boolean;
    /** Callback when regenerate button is clicked */
    onRegenerate: () => void;
    /** Callback when add mode is toggled */
    onToggleAddMode: () => void;
    /** Helper text shown on the right side */
    helperText?: string;
}

/**
 * DetectionToolbar - Toolbar for cookie detection operations.
 *
 * Provides buttons for regenerating detections and toggling manual add mode.
 * Displays detection count and contextual helper text.
 */
export function DetectionToolbar({
    detectionCount,
    isRegenerating,
    isAddMode,
    onRegenerate,
    onToggleAddMode,
    helperText,
}: DetectionToolbarProps) {
    const defaultHelperText = isAddMode
        ? 'Click on image to add detection'
        : 'Click on detection to delete';

    return (
        <div className={styles.toolbar}>
            <div className={styles.left}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={onRegenerate}
                    disabled={isRegenerating}
                >
                    <span className={styles.icon}>{isRegenerating ? '⏳' : '↻'}</span>
                    {isRegenerating ? 'Scanning...' : 'Regenerate'}
                </button>

                <button
                    type="button"
                    className={`${styles.button} ${isAddMode ? styles.buttonActive : ''}`}
                    onClick={onToggleAddMode}
                >
                    <span className={styles.icon}>+</span>
                    Add Manual
                </button>

                <span className={styles.count}>{detectionCount} detections</span>
            </div>

            <div className={styles.right}>{helperText || defaultHelperText}</div>
        </div>
    );
}
