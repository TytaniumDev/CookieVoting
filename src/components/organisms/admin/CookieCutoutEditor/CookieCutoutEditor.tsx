import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CookieViewer, type DetectedCookie } from '../../CookieViewer/CookieViewer';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useDetectionJob } from '../../../../lib/hooks/useDetectionJob';
import { useDetectionResults } from '../../../../lib/hooks/useDetectionResults';
import { DetectionToolbar } from '../../../molecules/DetectionToolbar';
import styles from './CookieCutoutEditor.module.css';

export interface CookieCutoutEditorProps {
    eventId: string;
    imageUrl: string;
    imageId?: string;
    onDetectionChange?: (detections: DetectedCookie[]) => void;
}

/**
 * CookieCutoutEditor - Manages detection zones on an image.
 *
 * Provides tools for regenerating AI detections, manually adding detections,
 * and deleting existing ones. Uses DetectionToolbar for controls.
 */
export function CookieCutoutEditor({
    eventId: _eventId,
    imageUrl,
    imageId,
    onDetectionChange,
}: CookieCutoutEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Store access
    const { images, getDetectionData, updateLocalDetections } = useImageStore();

    // Detection job hook
    const { triggerSingleDetection, isDetecting } = useDetectionJob({
        onError: (error) => {
            console.error('Detection error:', error);
            setError(error);
        },
    });

    // Local state
    const [localDetections, setLocalDetections] = useState<DetectedCookie[] | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Watch for live detection updates via hook
    const liveDetections = useDetectionResults(imageUrl);

    // Find image entity and get detections
    const imageEntity = useMemo(
        () => (imageId ? images[imageId] : Object.values(images).find((img) => img.url === imageUrl)),
        [images, imageId, imageUrl],
    );

    const effectiveImageId = imageEntity?.id || imageId;

    // Use local detections (for optimistic updates) or live or store fallback
    const detectedCookies = useMemo(() => {
        if (localDetections) return localDetections;
        if (liveDetections) return liveDetections;
        if (effectiveImageId) return getDetectionData(effectiveImageId) || [];
        return [];
    }, [localDetections, liveDetections, effectiveImageId, getDetectionData]);

    // Reset local detections when live detections change
    useEffect(() => {
        if (liveDetections) {
            setLocalDetections(null);
        }
    }, [liveDetections]);

    // Notify parent of detection changes
    useEffect(() => {
        onDetectionChange?.(detectedCookies);
    }, [detectedCookies, onDetectionChange]);

    const handleRegenerate = useCallback(async () => {
        if (!imageUrl || isRegenerating) return;

        setIsRegenerating(true);
        setError(null);

        try {
            await triggerSingleDetection(imageUrl);
        } catch (err) {
            console.error('Regenerate failed:', err);
        } finally {
            setIsRegenerating(false);
        }
    }, [imageUrl, triggerSingleDetection, isRegenerating]);

    const handleToggleAddMode = useCallback(() => {
        setIsAddMode((prev) => !prev);
    }, []);

    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isAddMode || !effectiveImageId) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            const newDetection: DetectedCookie = {
                x,
                y,
                width: 8,
                height: 8,
                confidence: 1.0,
            };

            const updatedDetections = [...detectedCookies, newDetection];

            if (effectiveImageId && updateLocalDetections) {
                updateLocalDetections(effectiveImageId, updatedDetections);
            }

            setLocalDetections(updatedDetections);
        },
        [isAddMode, effectiveImageId, detectedCookies, updateLocalDetections],
    );

    const handleDeleteDetection = useCallback(
        (index: number, e: React.MouseEvent) => {
            e.stopPropagation();

            const updatedDetections = detectedCookies.filter((_, i) => i !== index);

            if (effectiveImageId && updateLocalDetections) {
                updateLocalDetections(effectiveImageId, updatedDetections);
            }

            setLocalDetections(updatedDetections);
        },
        [detectedCookies, effectiveImageId, updateLocalDetections],
    );

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
            {/* Toolbar (using DetectionToolbar molecule) */}
            <DetectionToolbar
                detectionCount={detectedCookies.length}
                isRegenerating={isRegenerating || isDetecting}
                isAddMode={isAddMode}
                onRegenerate={handleRegenerate}
                onToggleAddMode={handleToggleAddMode}
            />

            {error && <div className={styles.error}>{error}</div>}

            {/* Image Container */}
            <div
                className={`${styles.imageContainer} ${isAddMode ? styles.addMode : ''}`}
                onClick={handleImageClick}
                role="presentation"
            >
                <div className={styles.viewerWrapper}>
                    <CookieViewer
                        imageUrl={imageUrl}
                        detectedCookies={detectedCookies}
                        onCookieClick={(cookie, index, e) => {
                            if (!isAddMode) {
                                handleDeleteDetection(index, e);
                            }
                        }}
                        renderTopLeft={({ index }) => (
                            <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={(e) => handleDeleteDetection(index, e)}
                                aria-label={`Delete detection ${index + 1}`}
                            >
                                ×
                            </button>
                        )}
                        borderColor="rgba(139, 92, 246, 0.6)"
                        disableZoom={isAddMode}
                    />
                </div>
            </div>
        </div>
    );
}
