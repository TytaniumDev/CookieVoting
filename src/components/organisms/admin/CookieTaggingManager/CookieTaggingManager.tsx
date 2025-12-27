import { useState, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { CookieViewer, type DetectedCookie } from '../../CookieViewer/CookieViewer';
import { useCookieStore } from '../../../../lib/stores/useCookieStore';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useDetectionResults } from '../../../../lib/hooks/useDetectionResults';
import { BakerDropdown } from '../../../molecules/BakerDropdown';
import { calculateAdjustedPosition } from './dropdownUtils';
import type { Cookie } from '../../../../lib/types';
import styles from './CookieTaggingManager.module.css';

interface DetectedCookieWithTag extends DetectedCookie {
    _tagged?: Cookie;
}

export interface CookieTaggingManagerProps {
    eventId: string;
    categoryId: string;
    imageUrl: string;
    categoryName?: string;
}

/**
 * CookieTaggingManager - Assigns bakers to detected cookies.
 *
 * Displays an image with cookie detections overlaid. Users can click
 * on cookies to assign bakers via a dropdown menu.
 */
export function CookieTaggingManager({
    eventId,
    categoryId,
    imageUrl,
    categoryName,
}: CookieTaggingManagerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Store access
    const { cookies, createCookie, deleteCookie } = useCookieStore();
    const { bakers } = useBakerStore();
    const { images, getDetectionData } = useImageStore();

    // Local state
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCookie, setSelectedCookie] = useState<DetectedCookieWithTag | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null);

    // Watch for live detection updates via hook
    const liveDetections = useDetectionResults(imageUrl);



    // Find image entity and get detections
    const imageEntity = useMemo(
        () => Object.values(images).find((img) => img.url === imageUrl),
        [images, imageUrl],
    );

    const detectedCookies = useMemo(() => {
        if (liveDetections) return liveDetections;
        if (imageEntity) return getDetectionData(imageEntity.id) || [];
        return [];
    }, [liveDetections, imageEntity, getDetectionData]);

    // Filter cookies for this category
    const taggedCookies = useMemo(
        () => cookies.filter((c) => c.categoryId === categoryId),
        [cookies, categoryId],
    );

    // Merge detections with tags
    const mergedDetections = useMemo<DetectedCookieWithTag[]>(() => {
        const mappedDetections = detectedCookies.map((d) => {
            const tagged = taggedCookies.find((t) => {
                const dist = Math.sqrt(Math.pow(t.x - d.x, 2) + Math.pow(t.y - d.y, 2));
                return dist < 2;
            });
            return { ...d, _tagged: tagged };
        });

        // Add manual tags that don't match any detection
        const manualTags = taggedCookies
            .filter(
                (t) =>
                    !detectedCookies.some((d) => {
                        const dist = Math.sqrt(Math.pow(t.x - d.x, 2) + Math.pow(t.y - d.y, 2));
                        return dist < 2;
                    }),
            )
            .map(
                (t) =>
                    ({
                        x: t.x,
                        y: t.y,
                        width: 10,
                        height: 10,
                        confidence: 1.0,
                        _tagged: t,
                    }) as DetectedCookieWithTag,
            );

        return [...mappedDetections, ...manualTags];
    }, [detectedCookies, taggedCookies]);

    // Progress calculation
    const taggedCount = mergedDetections.filter((d) => d._tagged).length;
    const totalCount = mergedDetections.length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showDropdown && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // Also check if click is inside the dropdown itself (portal scenario, though here it's nested)
                // Since it's nested in containerRef, the above check technically covers it if dropdown is in container.
                // But if dropdown is fixed positioned, it might be visually outside but DOM-wise inside.
                // Let's safe-guard:
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                    return;
                }

                setShowDropdown(false);
                setSelectedCookie(null);
                setDropdownPosition(null);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    // Adjust position if dropdown goes off screen
    useLayoutEffect(() => {
        if (showDropdown && dropdownPosition && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();

            const adjusted = calculateAdjustedPosition(
                dropdownPosition.x,
                dropdownPosition.y,
                rect.width,
                rect.height,
                window.innerWidth,
                window.innerHeight
            );

            // Only update if different to avoid loops (though strict equality check on object might fail, contents matter)
            if (adjusted.x !== dropdownPosition.x || adjusted.y !== dropdownPosition.y) {
                setDropdownPosition(adjusted);
            }
        }
    }, [showDropdown, dropdownPosition]);

    const closeDropdown = useCallback(() => {
        setShowDropdown(false);
        setSelectedCookie(null);
        setDropdownPosition(null);
    }, []);

    const handleCookieClick = useCallback(
        (cookie: DetectedCookieWithTag, _index: number, e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedCookie(cookie);
            // Use e.clientX/Y directly, creating a new object ref triggers the effect
            setDropdownPosition({ x: e.clientX, y: e.clientY });
            setShowDropdown(true);
        },
        [],
    );

    const handleBakerSelect = useCallback(
        async (bakerId: string) => {
            if (!selectedCookie) return;

            const effectiveImageId = imageEntity?.id || `legacy-image-${categoryId}`;
            const pseudoId = `${selectedCookie.x.toFixed(2)}_${selectedCookie.y.toFixed(2)}`;

            try {
                await createCookie(eventId, categoryId, effectiveImageId, bakerId, pseudoId, selectedCookie.x, selectedCookie.y, undefined);
            } catch (error) {
                console.error('Failed to assign baker:', error);
            }

            closeDropdown();
        },
        [eventId, categoryId, imageEntity, selectedCookie, createCookie, closeDropdown],
    );

    const handleRemoveAssignment = useCallback(async () => {
        if (!selectedCookie?._tagged) return;

        try {
            await deleteCookie(eventId, selectedCookie._tagged.id);
        } catch (error) {
            console.error('Failed to remove assignment:', error);
        }

        closeDropdown();
    }, [eventId, selectedCookie, deleteCookie, closeDropdown]);

    if (!imageUrl) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🖼️</span>
                    <p>No image to display</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.header}>
                {categoryName && <h4 className={styles.title}>{categoryName}</h4>}
                <span className={styles.progress}>
                    {taggedCount} of {totalCount} tagged
                </span>
            </div>

            <div className={styles.imageContainer}>
                <div className={styles.viewerWrapper}>
                    <CookieViewer
                        imageUrl={imageUrl}
                        detectedCookies={mergedDetections}
                        selectedIndex={selectedCookie ? mergedDetections.indexOf(selectedCookie) : undefined}
                        onCookieClick={handleCookieClick}
                        renderBottom={({ detected }: { detected: DetectedCookieWithTag }) => {
                            if (detected._tagged) {
                                const baker = bakers.find((b) => b.id === detected._tagged?.bakerId);
                                return (
                                    <button
                                        type="button"
                                        className={styles.bakerLabel}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCookie(detected);
                                            setDropdownPosition({ x: e.clientX, y: e.clientY });
                                            setShowDropdown(true);
                                        }}
                                    >
                                        {baker?.name || detected._tagged?.makerName || 'Unknown'}
                                    </button>
                                );
                            }
                            return <span className={`${styles.bakerLabel} ${styles.untaggedLabel}`}>?</span>;
                        }}
                        borderColor="rgba(255, 255, 255, 0.3)"
                        disableZoom={true}
                    />
                </div>
            </div>

            {/* Baker Assignment Dropdown (using BakerDropdown molecule) */}
            {showDropdown && dropdownPosition && (
                <div
                    className={styles.dropdownWrapper}
                    style={{ left: dropdownPosition.x, top: dropdownPosition.y }}
                    ref={dropdownRef}
                >
                    <BakerDropdown
                        bakers={bakers}
                        selectedBakerId={selectedCookie?._tagged?.bakerId}
                        onSelect={handleBakerSelect}
                        onRemove={handleRemoveAssignment}
                        onClose={closeDropdown}
                        showRemove={!!selectedCookie?._tagged}
                    />
                </div>
            )}
        </div>
    );
}
