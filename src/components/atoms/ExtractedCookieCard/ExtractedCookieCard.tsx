import React from 'react';
import styles from './ExtractedCookieCard.module.css';

export interface ExtractedCookieCardProps {
    /** URL to the extracted cookie image */
    imageUrl: string;
    /** Cookie identifier */
    cookieId: string;
    /** Index of the cookie in the list */
    index: number;
    /** Optional confidence score */
    confidence?: number;
    /** Optional click handler */
    onClick?: () => void;
}

/**
 * Displays an individual extracted cookie image in a card format.
 * Used in the Image Detection Audit page to show separated cookies.
 */
export function ExtractedCookieCard({
    imageUrl,
    cookieId,
    index,
    confidence,
    onClick,
}: ExtractedCookieCardProps) {
    return (
        <div
            className={styles.card}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            <div className={styles.imageContainer}>
                <img
                    src={imageUrl}
                    alt={`Extracted cookie ${index + 1}`}
                    className={styles.image}
                    loading="lazy"
                />
            </div>
            <div className={styles.info}>
                <span className={styles.label}>Cookie {index + 1}</span>
                {confidence !== undefined && (
                    <span className={styles.confidence}>
                        {Math.round(confidence * 100)}%
                    </span>
                )}
            </div>
        </div>
    );
}
