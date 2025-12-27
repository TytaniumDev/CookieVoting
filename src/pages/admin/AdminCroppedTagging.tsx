import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEventStore } from '../../lib/stores/useEventStore';
import { useImageStore } from '../../lib/stores/useImageStore';
import { CroppedCookieTaggingGrid } from '../../components/organisms/admin/CroppedCookieTaggingGrid';
import { ProgressDots, type DotItem } from '../../components/molecules/ProgressDots';
import styles from './AdminCroppedTagging.module.css';

interface CategoryProgress {
    categoryId: string;
    taggedCount: number;
    totalCount: number;
}

/**
 * AdminCroppedTagging - Page for tagging individual cropped cookie images.
 * 
 * Displays a category navigator similar to the regular Tag Cookies page,
 * but shows individual cropped cookie images instead of detection overlays.
 * Allows admins to assign bakers to each cropped cookie.
 */
export default function AdminCroppedTagging() {
    const { eventId = '' } = useParams();

    // Store access
    const { categories, loading: categoriesLoading } = useEventStore();
    const { images, fetchCroppedCookiesForCategory, getCroppedCookiesForCategory } = useImageStore();

    // Local state
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch cropped cookies for all categories on mount
    useEffect(() => {
        if (eventId && categories.length > 0) {
            categories.forEach(cat => {
                fetchCroppedCookiesForCategory(eventId, cat.id);
            });
        }
    }, [eventId, categories, fetchCroppedCookiesForCategory]);

    // Calculate progress for each category
    // We depend on the images count to trigger recomputation when images change
    const imageCount = Object.keys(images).length;
    const categoryProgress = useMemo<CategoryProgress[]>(() => {
        return categories.map(cat => {
            const croppedCookies = getCroppedCookiesForCategory(cat.id);
            const taggedCount = croppedCookies.filter(c => c.bakerId).length;
            return {
                categoryId: cat.id,
                taggedCount,
                totalCount: croppedCookies.length,
            };
        });
    }, [categories, getCroppedCookiesForCategory, imageCount]);

    // Convert to ProgressDots format
    const progressItems = useMemo<DotItem[]>(() =>
        categoryProgress.map((p, index) => {
            const cat = categories[index];
            let status: 'empty' | 'partial' | 'complete' = 'empty';

            if (p.totalCount > 0 && p.taggedCount >= p.totalCount) {
                status = 'complete';
            } else if (p.taggedCount > 0) {
                status = 'partial';
            } else if (p.totalCount === 0) {
                status = 'empty';
            }

            return {
                id: p.categoryId,
                label: `${cat?.name || 'Unknown'}: ${p.taggedCount}/${p.totalCount} tagged`,
                status,
            };
        }),
        [categoryProgress, categories]);

    // Current category
    const currentCategory = categories[currentIndex];
    const currentProgress = categoryProgress[currentIndex];

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => Math.min(categories.length - 1, prev + 1));
    }, [categories.length]);

    const handleDotClick = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Check if all categories are complete
    const allComplete = categoryProgress.every(p => p.totalCount > 0 && p.taggedCount >= p.totalCount);
    const totalCropped = categoryProgress.reduce((sum, p) => sum + p.totalCount, 0);

    if (categoriesLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading categories...</div>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className={styles.container}>
                <h2 className={styles.pageTitle}>Tag Cropped Cookies</h2>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📂</span>
                    <p>No categories found. Add categories first.</p>
                </div>
            </div>
        );
    }

    if (totalCropped === 0) {
        return (
            <div className={styles.container}>
                <h2 className={styles.pageTitle}>Tag Cropped Cookies</h2>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>✂️</span>
                    <p className={styles.emptyTitle}>No cropped cookies yet</p>
                    <p className={styles.emptyDescription}>
                        Use the Cookie Cropper to create individual cookie images from your tray photos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>Tag Cropped Cookies</h2>

            <div className={styles.content}>
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

                    {/* Progress Dots */}
                    <ProgressDots
                        items={progressItems}
                        activeIndex={currentIndex}
                        onDotClick={handleDotClick}
                    />

                    {allComplete && categories.length > 0 && (
                        <div className={styles.allCompleteMessage}>
                            ✓ All cropped cookies have been tagged!
                        </div>
                    )}
                </div>

                {/* Tagging Grid */}
                <div className={styles.gridContainer}>
                    {currentCategory && (
                        <CroppedCookieTaggingGrid
                            eventId={eventId}
                            categoryId={currentCategory.id}
                            categoryName={currentCategory.name}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
