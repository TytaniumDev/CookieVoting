import { useState, useCallback, useEffect, useMemo } from 'react';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { useCookieStore } from '../../../../lib/stores/useCookieStore';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useCategoryDetectionCounts } from '../../../../lib/hooks/useDetectionResults';
import { CookieTaggingManager } from '../CookieTaggingManager';
import { ProgressDots, type DotItem } from '../../../molecules/ProgressDots';
import styles from './CategoryTaggingNavigator.module.css';

export interface CategoryTaggingNavigatorProps {
    eventId: string;
    initialCategoryId?: string;
}

interface CategoryProgress {
    categoryId: string;
    taggedCount: number;
    totalCount: number;
}

/**
 * CategoryTaggingNavigator - High-level navigation for tagging cookies across categories.
 *
 * Displays navigation controls, category info, and progress dots.
 * Renders CookieTaggingManager for the active category.
 */
export function CategoryTaggingNavigator({ eventId, initialCategoryId }: CategoryTaggingNavigatorProps) {
    // Store access
    const { categories, fetchCategories, loading: categoriesLoading } = useEventStore();
    const { cookies, fetchCookies } = useCookieStore();
    const { images, getDetectionData, fetchImagesForEvent } = useImageStore();

    // Local state
    const [currentIndex, setCurrentIndex] = useState(0);

    // Watch detection counts for all categories via hook
    const { counts: detectionCounts } = useCategoryDetectionCounts(
        categories.map((c) => ({ id: c.id, imageUrl: c.imageUrl })),
    );

    // Fetch data on mount
    useEffect(() => {
        if (eventId) {
            fetchCategories(eventId);
            fetchCookies(eventId);
            fetchImagesForEvent(eventId);
        }
    }, [eventId, fetchCategories, fetchCookies, fetchImagesForEvent]);

    // Set initial index if provided
    useEffect(() => {
        if (initialCategoryId && categories.length > 0) {
            const idx = categories.findIndex((c) => c.id === initialCategoryId);
            if (idx !== -1) {
                setCurrentIndex(idx);
            }
        }
    }, [initialCategoryId, categories]);

    // Calculate progress for each category
    const categoryProgress = useMemo<CategoryProgress[]>(() => {
        return categories.map((cat) => {
            const catCookies = cookies.filter((c) => c.categoryId === cat.id);
            let totalCount = detectionCounts[cat.id] || 0;

            // Fallback: check images store
            if (totalCount === 0) {
                const imageEntity = Object.values(images).find((img) => img.url === cat.imageUrl);
                if (imageEntity) {
                    const detections = getDetectionData(imageEntity.id);
                    totalCount = detections?.length || 0;
                }
            }

            // If still 0, use cookies count as minimum
            if (totalCount === 0 && catCookies.length > 0) {
                totalCount = catCookies.length;
            }

            return {
                categoryId: cat.id,
                taggedCount: catCookies.length,
                totalCount,
            };
        });
    }, [categories, cookies, detectionCounts, images, getDetectionData]);

    // Convert to ProgressDots format
    const progressItems = useMemo<DotItem[]>(
        () =>
            categoryProgress.map((p, index) => {
                const cat = categories[index];
                let status: 'empty' | 'partial' | 'complete' = 'empty';

                if (p.totalCount > 0 && p.taggedCount >= p.totalCount) {
                    status = 'complete';
                } else if (p.taggedCount > 0) {
                    status = 'partial';
                }

                return {
                    id: p.categoryId,
                    label: `${cat?.name || 'Unknown'}: ${p.taggedCount}/${p.totalCount} tagged`,
                    status,
                };
            }),
        [categoryProgress, categories],
    );

    // Current category
    const currentCategory = categories[currentIndex];
    const currentProgress = categoryProgress[currentIndex];

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => Math.min(categories.length - 1, prev + 1));
    }, [categories.length]);

    const handleDotClick = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Check if all categories are complete
    const allComplete = categoryProgress.every((p) => p.totalCount > 0 && p.taggedCount >= p.totalCount);

    if (categoriesLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>Loading categories...</div>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📂</span>
                    <p>No categories to tag. Add categories first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Navigation Header */}
            <div className={styles.navigation}>
                <div className={styles.navRow}>
                    <button
                        type="button"
                        className={styles.navButton}
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        aria-label="Previous category"
                    >
                        ← Prev
                    </button>

                    <div className={styles.categoryInfo}>
                        <span className={styles.categoryName}>{currentCategory?.name}</span>
                        {currentProgress && (
                            <span className={styles.categoryProgress}>
                                {currentProgress.taggedCount} of {currentProgress.totalCount} tagged
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className={styles.navButton}
                        onClick={handleNext}
                        disabled={currentIndex === categories.length - 1}
                        aria-label="Next category"
                    >
                        Next →
                    </button>
                </div>

                {/* Progress Dots (using ProgressDots molecule) */}
                <ProgressDots items={progressItems} activeIndex={currentIndex} onDotClick={handleDotClick} />

                {allComplete && categories.length > 0 && (
                    <div className={styles.allCompleteMessage}>✓ All categories have been tagged!</div>
                )}
            </div>

            {/* Tagging Content */}
            <div className={styles.content}>
                {currentCategory && (
                    <CookieTaggingManager
                        eventId={eventId}
                        categoryId={currentCategory.id}
                        imageUrl={currentCategory.imageUrl}
                        categoryName={currentCategory.name}
                    />
                )}
            </div>
        </div>
    );
}
