import { useState, useEffect, useCallback, useMemo } from 'react';
import { watchImageDetectionResults } from '../firestore';
import type { DetectedCookie } from '../../components/organisms/CookieViewer/CookieViewer';

/**
 * Hook for watching live detection results for an image.
 * Abstracts Firestore subscription from components.
 *
 * @param imageUrl - URL of the image to watch detections for
 * @returns Array of detected cookies, auto-updating when detection results change
 */
export function useDetectionResults(imageUrl: string | undefined) {
    const [detections, setDetections] = useState<DetectedCookie[] | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setDetections(null);
            return;
        }

        const unsubscribe = watchImageDetectionResults(imageUrl, (results) => {
            if (results) {
                setDetections(results as DetectedCookie[]);
            } else {
                setDetections(null);
            }
        });

        return unsubscribe;
    }, [imageUrl]);

    return detections;
}

/**
 * Hook for watching detection counts across multiple categories.
 * Returns a map of categoryId -> detection count.
 *
 * @param categories - Array of categories with imageUrl properties
 * @returns Record mapping category IDs to detection counts
 */
export function useCategoryDetectionCounts(
    categories: Array<{ id: string; imageUrl: string }>,
) {
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Create a stable key from category IDs to prevent infinite re-subscription
    // when parent component passes a new array reference each render
    const categoriesKey = useMemo(
        () => categories.map((c) => `${c.id}:${c.imageUrl}`).sort().join(','),
        [categories]
    );

    useEffect(() => {
        const unsubscribes: (() => void)[] = [];

        categories.forEach((cat) => {
            if (cat.imageUrl) {
                const unsub = watchImageDetectionResults(cat.imageUrl, (results) => {
                    const count = results ? (results as DetectedCookie[]).length : 0;
                    setCounts((prev) => ({ ...prev, [cat.id]: count }));
                });
                unsubscribes.push(unsub);
            }
        });

        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Using categoriesKey for stability
    }, [categoriesKey]);

    const resetCounts = useCallback(() => {
        setCounts({});
    }, []);

    return { counts, resetCounts };
}

