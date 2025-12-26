import styles from './BakerDropdown.module.css';

export interface Baker {
    id: string;
    name: string;
}

export interface BakerDropdownProps {
    /** List of available bakers */
    bakers: Baker[];
    /** Currently selected baker ID (if any) */
    selectedBakerId?: string;
    /** Title displayed in the dropdown header */
    title?: string;
    /** Callback when a baker is selected */
    onSelect: (bakerId: string) => void;
    /** Callback when the remove/unassign button is clicked */
    onRemove?: () => void;
    /** Callback when the close button is clicked */
    onClose: () => void;
    /** Whether to show the remove button */
    showRemove?: boolean;
}

/**
 * BakerDropdown - A dropdown for selecting a baker.
 *
 * Displays a list of bakers with selection state. Includes close button
 * and optional remove/unassign button.
 */
export function BakerDropdown({
    bakers,
    selectedBakerId,
    title = 'Assign Baker',
    onSelect,
    onRemove,
    onClose,
    showRemove = false,
}: BakerDropdownProps) {
    return (
        <div className={styles.dropdown} role="dialog" aria-label={title}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div className={styles.list} role="listbox">
                {bakers.length > 0 ? (
                    bakers.map((baker) => {
                        const isSelected = selectedBakerId === baker.id;
                        return (
                            <button
                                key={baker.id}
                                type="button"
                                className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                                onClick={() => onSelect(baker.id)}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {baker.name}
                                {isSelected && <span className={styles.checkmark}>✓</span>}
                            </button>
                        );
                    })
                ) : (
                    <div className={styles.emptyMessage}>No bakers available</div>
                )}
            </div>

            {showRemove && onRemove && (
                <button
                    type="button"
                    className={styles.removeButton}
                    onClick={onRemove}
                >
                    Remove Assignment
                </button>
            )}
        </div>
    );
}
