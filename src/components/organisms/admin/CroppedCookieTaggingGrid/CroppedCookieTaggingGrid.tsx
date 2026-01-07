import { useState, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { CroppedCookieCard } from '../../../molecules/CroppedCookieCard';
import { BakerDropdown } from '../../../molecules/BakerDropdown';
import { calculateAdjustedPosition } from '../CookieTaggingManager/dropdownUtils';
import type { ImageEntity } from '../../../../lib/types';
import styles from './CroppedCookieTaggingGrid.module.css';

type FilterMode = 'all' | 'tagged' | 'untagged';

export interface CroppedCookieTaggingGridProps {
    /** Event ID to fetch cookies for */
    eventId: string;
    /** Category ID to show cookies for */
    categoryId: string;
    /** Category name for display */
    categoryName: string;
}

/**
 * CroppedCookieTaggingGrid - Grid of cropped cookie images for baker assignment.
 * 
 * Displays all cropped cookie images for a category in a responsive grid.
 * Clicking a cookie opens a dropdown to assign a baker.
 * Shows progress indicator and filter controls.
 */
export function CroppedCookieTaggingGrid({
    eventId,
    categoryId,
    categoryName,
}: CroppedCookieTaggingGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Store access
    const {
        images,
        loading,
        subscribeToCroppedCookies,
        unsubscribeFromCroppedCookies,
        assignBaker,
        getCroppedCookiesForCategory,
    } = useImageStore();
    const { bakers } = useBakerStore();

    // Local state
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [selectedCookieId, setSelectedCookieId] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null);

    // Subscribe to cropped cookies when category changes
    useEffect(() => {
        if (eventId && categoryId) {
            subscribeToCroppedCookies(eventId, categoryId);
        }
        
        return () => {
            if (categoryId) {
                unsubscribeFromCroppedCookies(categoryId);
            }
        };
    }, [eventId, categoryId, subscribeToCroppedCookies, unsubscribeFromCroppedCookies]);

    // Get cropped cookies for this category
    // We depend on the images count to trigger recomputation when images change
    const imageCount = Object.keys(images).length;
    const croppedCookies = useMemo(() => {
        return getCroppedCookiesForCategory(categoryId);
    }, [getCroppedCookiesForCategory, categoryId, imageCount]);

    // Apply filter
    const filteredCookies = useMemo(() => {
        switch (filterMode) {
            case 'tagged':
                return croppedCookies.filter(c => c.bakerId);
            case 'untagged':
                return croppedCookies.filter(c => !c.bakerId);
            default:
                return croppedCookies;
        }
    }, [croppedCookies, filterMode]);

    // Calculate progress
    const taggedCount = croppedCookies.filter(c => c.bakerId).length;
    const totalCount = croppedCookies.length;
    const allComplete = totalCount > 0 && taggedCount === totalCount;

    // Get selected cookie
    const selectedCookie = selectedCookieId ? images[selectedCookieId] : null;

    const closeDropdown = useCallback(() => {
        setSelectedCookieId(null);
        setDropdownPosition(null);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                selectedCookieId &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                    return;
                }
                closeDropdown();
            }
        };

        if (selectedCookieId) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [selectedCookieId, closeDropdown]);

    // Adjust dropdown position if it goes off screen
    useLayoutEffect(() => {
        if (selectedCookieId && dropdownPosition && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const adjusted = calculateAdjustedPosition(
                dropdownPosition.x,
                dropdownPosition.y,
                rect.width,
                rect.height,
                window.innerWidth,
                window.innerHeight
            );

            if (adjusted.x !== dropdownPosition.x || adjusted.y !== dropdownPosition.y) {
                setDropdownPosition(adjusted);
            }
        }
    }, [selectedCookieId, dropdownPosition]);

    const handleCardClick = useCallback((cookie: ImageEntity, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCookieId(cookie.id);
        setDropdownPosition({ x: e.clientX, y: e.clientY });
    }, []);

    const handleBakerSelect = useCallback(async (bakerId: string) => {
        if (!selectedCookieId) return;

        try {
            await assignBaker(selectedCookieId, bakerId);
        } catch (error) {
            console.error('Failed to assign baker:', error);
        }

        closeDropdown();
    }, [selectedCookieId, assignBaker, closeDropdown]);

    const handleRemoveAssignment = useCallback(async () => {
        if (!selectedCookieId) return;

        try {
            await assignBaker(selectedCookieId, null);
        } catch (error) {
            console.error('Failed to remove assignment:', error);
        }

        closeDropdown();
    }, [selectedCookieId, assignBaker, closeDropdown]);

    // Get baker name for a cookie
    const getBakerName = useCallback((bakerId: string | undefined) => {
        if (!bakerId) return undefined;
        const baker = bakers.find(b => b.id === bakerId);
        return baker?.name;
    }, [bakers]);

    if (loading && croppedCookies.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}>🍪</div>
                    <p>Loading cookies...</p>
                </div>
            </div>
        );
    }

    if (croppedCookies.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📷</span>
                    <p className={styles.emptyTitle}>No cropped cookies yet</p>
                    <p className={styles.emptyDescription}>
                        Use the Cookie Cropper to create individual cookie images from tray photos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>{categoryName}</h3>
                    <span className={styles.progress}>
                        {taggedCount} of {totalCount} tagged
                    </span>
                </div>

                {/* Filter Controls */}
                <div className={styles.filters}>
                    <button
                        type="button"
                        className={`${styles.filterButton} ${filterMode === 'all' ? styles.active : ''}`}
                        onClick={() => setFilterMode('all')}
                    >
                        All ({totalCount})
                    </button>
                    <button
                        type="button"
                        className={`${styles.filterButton} ${filterMode === 'tagged' ? styles.active : ''}`}
                        onClick={() => setFilterMode('tagged')}
                    >
                        Tagged ({taggedCount})
                    </button>
                    <button
                        type="button"
                        className={`${styles.filterButton} ${filterMode === 'untagged' ? styles.active : ''}`}
                        onClick={() => setFilterMode('untagged')}
                    >
                        Untagged ({totalCount - taggedCount})
                    </button>
                </div>

                {allComplete && (
                    <div className={styles.completeMessage}>
                        ✓ All cookies in this category have been tagged!
                    </div>
                )}
            </div>

            {/* Cookie Grid */}
            <div className={styles.grid}>
                {filteredCookies.map((cookie) => (
                    <CroppedCookieCard
                        key={cookie.id}
                        imageUrl={cookie.url}
                        bakerName={getBakerName(cookie.bakerId)}
                        isSelected={selectedCookieId === cookie.id}
                        onClick={(e) => handleCardClick(cookie, e)}
                    />
                ))}
            </div>

            {filteredCookies.length === 0 && croppedCookies.length > 0 && (
                <div className={styles.noResults}>
                    No {filterMode === 'tagged' ? 'tagged' : 'untagged'} cookies in this category.
                </div>
            )}

            {/* Baker Dropdown */}
            {selectedCookieId && dropdownPosition && (
                <div
                    className={styles.dropdownWrapper}
                    style={{ left: dropdownPosition.x, top: dropdownPosition.y }}
                    ref={dropdownRef}
                >
                    <BakerDropdown
                        bakers={bakers}
                        selectedBakerId={selectedCookie?.bakerId}
                        onSelect={handleBakerSelect}
                        onRemove={handleRemoveAssignment}
                        onClose={closeDropdown}
                        showRemove={!!selectedCookie?.bakerId}
                    />
                </div>
            )}
        </div>
    );
}
