import { useState, useCallback, memo, useMemo } from 'react';
import { cn } from '../../../lib/cn';
import { BakerDropdown } from '../BakerDropdown/BakerDropdown';
import { OutsideClickHandler } from '../../atoms/OutsideClickHandler/OutsideClickHandler';
import type { Baker } from '../../../lib/types';

export interface CroppedCookieCardProps {
    /** URL of the cropped cookie image */
    imageUrl: string;
    /** ID of the assigned baker, or undefined if untagged */
    assignedBakerId?: string;
    /** List of all available bakers */
    bakers: Baker[];
    /** Called when a baker is assigned */
    onAssign: (bakerId: string) => void;
    /** Called when assignment is removed */
    onRemove: () => void;
    /** Optional CSS class name */
    className?: string;
}

/**
 * CroppedCookieCard - Displays an individual cropped cookie image with tagging status.
 *
 * Allows direct assignment of bakers via an integrated dropdown.
 */
export const CroppedCookieCard = memo(function CroppedCookieCard({
    imageUrl,
    assignedBakerId,
    bakers,
    onAssign,
    onRemove,
    className,
}: CroppedCookieCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const assignedBaker = useMemo(() =>
        bakers.find(b => b.id === assignedBakerId),
        [bakers, assignedBakerId]
    );

    const handleAssign = useCallback((bakerId: string) => {
        onAssign(bakerId);
        setShowDropdown(false);
    }, [onAssign]);

    const handleRemove = useCallback(() => {
        onRemove();
        setShowDropdown(false);
    }, [onRemove]);

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-xl transition-all p-0 group',
                'hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
                showDropdown && 'z-20',
                className
            )}
            data-testid="cookie-card"
        >
            {/* Image Container */}
            <button
                type="button"
                className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-[#252542] cursor-pointer ring-2 ring-transparent group-hover:ring-[#a78bfa]/30 transition-all border-none p-0"
                onClick={() => setShowDropdown(true)}
            >
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
            </button>

            {/* Assignment Trigger Area */}
            <div className="relative bg-[#1a1a2e] rounded-b-xl border-t border-white/5">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={cn(
                        'w-full px-3 py-2.5 text-left text-sm font-medium flex items-center justify-between transition-colors',
                        assignedBaker
                            ? 'text-[#c4b5fd] hover:text-[#ddd6fe]'
                            : 'text-gray-400 hover:text-gray-300'
                    )}
                >
                    <span className="truncate">
                        {assignedBaker ? assignedBaker.name : 'Select Baker...'}
                    </span>
                    <span className="text-xs opacity-50 ml-2">▼</span>
                </button>

                {/* Dropdown */}
                {showDropdown && (
                    <OutsideClickHandler onOutsideClick={() => setShowDropdown(false)}>
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 min-w-[200px] shadow-xl">
                            <BakerDropdown
                                bakers={bakers}
                                selectedBakerId={assignedBakerId}
                                onSelect={handleAssign}
                                onRemove={handleRemove}
                                onClose={() => setShowDropdown(false)}
                                showRemove={!!assignedBakerId}
                                title={assignedBaker ? 'Change Baker' : 'Assign Baker'}
                            />
                        </div>
                    </OutsideClickHandler>
                )}
            </div>
        </div>
    );
});
