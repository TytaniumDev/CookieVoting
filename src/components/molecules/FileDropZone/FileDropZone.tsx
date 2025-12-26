import { useState, useRef, useCallback } from 'react';
import styles from './FileDropZone.module.css';

export interface FileDropZoneProps {
    /** Accepted file types (e.g., "image/*") */
    accept?: string;
    /** Callback when a file is selected or dropped */
    onFileSelect: (file: File) => void;
    /** Icon to display in the drop zone */
    icon?: string;
    /** Main text to display */
    text?: string;
    /** Hint text below main text */
    hint?: string;
    /** Aria label for accessibility */
    ariaLabel?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
}

/**
 * FileDropZone - A drag-and-drop file upload component.
 *
 * Supports clicking to open file dialog or drag-and-drop.
 * Provides visual feedback during drag operations.
 */
export function FileDropZone({
    accept = 'image/*',
    onFileSelect,
    icon = '📷',
    text = 'Click or drag a file here',
    hint,
    ariaLabel = 'Upload file',
    disabled = false,
}: FileDropZoneProps) {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = useCallback(() => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    }, [disabled]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        },
        [disabled],
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files[0]);
                // Reset input so same file can be selected again
                e.target.value = '';
            }
        },
        [onFileSelect],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);

            if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onFileSelect(e.dataTransfer.files[0]);
            }
        },
        [disabled, onFileSelect],
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (!disabled) {
                setDragOver(true);
            }
        },
        [disabled],
    );

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    return (
        <div
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} `}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel}
            aria-disabled={disabled}
        >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.text}>{text}</span>
            {hint && <span className={styles.hint}>{hint}</span>}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className={styles.hiddenInput}
                disabled={disabled}
            />
        </div>
    );
}
