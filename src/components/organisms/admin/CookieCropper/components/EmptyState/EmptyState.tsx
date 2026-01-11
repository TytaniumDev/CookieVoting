/**
 * EmptyState Component
 *
 * Drop zone for uploading cookie tray images.
 * Shown when no image is selected.
 */
import { useRef, useState, useCallback } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
    /** Called when a file is selected */
    onFileSelect: (file: File) => void;
    /** Whether uploading is in progress */
    isUploading?: boolean;
}

export function EmptyState({ onFileSelect, isUploading = false }: EmptyStateProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div
            className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
            aria-label="Drop zone for cookie tray image"
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleInputChange}
            />

            <div className={styles.content}>
                <div className={styles.icon}>🍪</div>
                <h2 className={styles.title}>
                    {isUploading ? 'Uploading...' : 'Drop Cookie Tray Here'}
                </h2>
                <p className={styles.subtitle}>
                    or click to select a file
                </p>
                <div className={styles.formats}>
                    Supports: JPG, PNG, WebP
                </div>
            </div>
        </div>
    );
}
