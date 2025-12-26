import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './CategoryCard.module.css';

export interface CategoryCardProps {
    /** Unique identifier for the category */
    id: string;
    /** Display name of the category */
    name: string;
    /** URL of the category image */
    imageUrl: string;
    /** Number of cookies tagged in this category */
    cookieCount: number;
    /** Callback when the image is clicked */
    onImageClick?: () => void;
    /** Callback when the name is saved after editing */
    onNameSave?: (newName: string) => void;
    /** Callback when delete is clicked */
    onDelete?: () => void;
}

/**
 * CategoryCard - Displays a category with image, editable name, and actions.
 *
 * A standalone presentational component for displaying a single category
 * in a grid. Supports inline name editing and delete functionality.
 */
export function CategoryCard({
    id,
    name,
    imageUrl,
    cookieCount,
    onImageClick,
    onNameSave,
    onDelete,
}: CategoryCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing) {
            const timer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, [isEditing]);

    // Reset edit name when name prop changes
    useEffect(() => {
        setEditName(name);
    }, [name]);

    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
        setEditName(name);
    }, [name]);

    const handleSave = useCallback(() => {
        if (editName.trim() && editName !== name) {
            onNameSave?.(editName.trim());
        }
        setIsEditing(false);
    }, [editName, name, onNameSave]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditName(name);
    }, [name]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleSave();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        },
        [handleSave, handleCancel],
    );

    return (
        <div className={styles.card} data-category-id={id}>
            <button
                type="button"
                className={styles.imageButton}
                onClick={onImageClick}
                aria-label={`View ${name}`}
            >
                <img
                    src={imageUrl}
                    alt={name}
                    className={styles.image}
                    loading="lazy"
                />
            </button>

            <div className={styles.content}>
                {isEditing ? (
                    <div className={styles.editRow}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            className={styles.editInput}
                            maxLength={100}
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            className={`${styles.smallButton} ${styles.smallButtonPrimary}`}
                            aria-label="Save"
                        >
                            ✓
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className={styles.smallButton}
                            aria-label="Cancel"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className={styles.nameButton}
                        onClick={handleStartEdit}
                        title="Click to rename"
                    >
                        {name}
                    </button>
                )}

                <span className={styles.cookieCount}>
                    {cookieCount} cookie{cookieCount !== 1 ? 's' : ''} tagged
                </span>

                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={onDelete}
                        className={`${styles.smallButton} ${styles.smallButtonDanger}`}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
