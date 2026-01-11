import { useState, useCallback, memo } from 'react';
import styles from './CroppedCookieCard.module.css';

export interface CroppedCookieCardProps {
    /** URL of the cropped cookie image */
    imageUrl: string;
    /** Name of assigned baker, or undefined if untagged */
    bakerName?: string;
    /** Whether this card is currently selected (dropdown open) */
    isSelected?: boolean;
    /** Called when the card is clicked, passes the mouse event */
    onClick?: (e: React.MouseEvent) => void;
    /** Optional CSS class name */
    className?: string;
}

/**
 * CroppedCookieCard - Displays an individual cropped cookie image with tagging status.
 * 
 * Shows a square thumbnail of the cookie with a baker name badge (or "Untagged" indicator).
 * Used in the CroppedCookieTaggingGrid to allow admins to assign bakers to each cookie.
 */
export const CroppedCookieCard = memo(function CroppedCookieCard({
    imageUrl,
    bakerName,
    isSelected = false,
    onClick,
    className,
}: CroppedCookieCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const isTagged = !!bakerName;

    return (
        <button
            type="button"
            className={`${styles.card} ${isSelected ? styles.selected : ''} ${className || ''}`}
            onClick={onClick}
            aria-label={bakerName ? `Cookie tagged as ${bakerName}` : 'Untagged cookie'}
            data-testid="cookie-card"
        >
            {/* Image Container */}
            <div className={styles.imageContainer}>
                {!imageLoaded && !imageError && (
                    <div className={styles.skeleton} aria-hidden="true" />
                )}

                {imageError ? (
                    <div className={styles.errorState}>
                        <span className={styles.errorIcon}>🍪</span>
                        <span className={styles.errorText}>Failed to load</span>
                    </div>
                ) : (
                    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                    <img
                        src={imageUrl}
                        alt="Cropped cookie"
                        className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        loading="lazy"
                    />
                )}

                {/* Selection overlay */}
                {isSelected && <div className={styles.selectionOverlay} />}
            </div>

            {/* Badge */}
            <div className={`${styles.badge} ${isTagged ? styles.taggedBadge : styles.untaggedBadge}`}>
                {isTagged ? (
                    <span className={styles.bakerName}>{bakerName}</span>
                ) : (
                    <span className={styles.untaggedText}>Untagged</span>
                )}
            </div>
        </button>
    );
});
