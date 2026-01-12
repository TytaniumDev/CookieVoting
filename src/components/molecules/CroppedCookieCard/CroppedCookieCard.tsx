import { useState, useCallback, memo } from 'react';
import { cn } from '../../../lib/cn';

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
            className={cn(
                'relative flex flex-col rounded-xl overflow-hidden bg-[#1a1a2e] border-2 border-transparent cursor-pointer transition-all p-0',
                'hover:-translate-y-0.5 hover:border-[#a78bfa] hover:shadow-[0_8px_24px_rgba(167,139,250,0.2)]',
                'focus-visible:outline-none focus-visible:border-[#a78bfa] focus-visible:shadow-[0_0_0_3px_rgba(167,139,250,0.3)]',
                isSelected && 'border-[#8b5cf6] shadow-[0_0_0_3px_rgba(139,92,246,0.4)]',
                className
            )}
            onClick={onClick}
            aria-label={bakerName ? `Cookie tagged as ${bakerName}` : 'Untagged cookie'}
            data-testid="cookie-card"
        >
            {/* Image Container */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#252542]">
                {!imageLoaded && !imageError && (
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-[#252542] via-[#1a1a2e] to-[#252542] bg-[length:200%_100%]"
                        style={{
                            animation: 'shimmer 1.5s infinite',
                        }}
                        aria-hidden="true"
                    />
                )}

                {imageError ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-[#6b7280]">
                        <span className="text-3xl opacity-50 mb-1">🍪</span>
                        <span className="text-xs">Failed to load</span>
                    </div>
                ) : (
                    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
                    <img
                        src={imageUrl}
                        alt="Cropped cookie"
                        className={cn(
                            'w-full h-full object-cover transition-opacity duration-300',
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        loading="lazy"
                    />
                )}

                {/* Selection overlay */}
                {isSelected && (
                    <div className="absolute inset-0 bg-[rgba(139,92,246,0.15)] pointer-events-none" />
                )}
            </div>

            {/* Badge */}
            <div
                className={cn(
                    'px-3 py-2 text-center text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap',
                    isTagged
                        ? 'bg-[#1e1b4b] text-[#c4b5fd]'
                        : 'bg-[#252542] text-[#6b7280]'
                )}
            >
                {isTagged ? (
                    <span className="block overflow-hidden text-ellipsis">{bakerName}</span>
                ) : (
                    <span className="opacity-70 italic">Untagged</span>
                )}
            </div>
        </button>
    );
});
