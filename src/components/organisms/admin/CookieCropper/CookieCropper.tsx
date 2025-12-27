/**
 * CookieCropper Component
 *
 * Visual canvas for displaying crop boxes on a cookie tray image.
 * Supports both controlled (regions passed as prop) and uncontrolled modes.
 * Features:
 * - Drag and resize individual crop boxes
 * - Percentage-based regions for responsive display
 * - Visual grid overlay
 */
import { useCallback, useRef, useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { type SliceRegion, type GridConfig } from './cropUtils';
import styles from './CookieCropper.module.css';

export interface CookieCropperProps {
    /** URL of the source image to crop */
    imageUrl: string;
    /** Controlled regions (optional - if provided, component works in controlled mode) */
    regions?: SliceRegion[];
    /** Called when regions change in controlled mode */
    onRegionsChange?: (regions: SliceRegion[]) => void;
    /** Callback when user saves (legacy uncontrolled mode) */
    onSave?: (blobs: Blob[]) => void;
    /** Callback when user cancels */
    onCancel?: () => void;
    /** Configuration for the visual grid overlay */
    gridConfig?: GridConfig;
    /** Whether to show the grid overlay */
    showGrid?: boolean;
}

interface CropRegion extends SliceRegion {
    id: string;
}

/**
 * Convert SliceRegion to CropRegion with ID
 */
function toInternalRegions(regions: SliceRegion[]): CropRegion[] {
    return regions.map((r, i) => ({
        ...r,
        id: `region-${i}`,
    }));
}

/**
 * Convert CropRegion to SliceRegion (remove ID)
 */
function toExternalRegions(regions: CropRegion[]): SliceRegion[] {
    return regions.map(({ x, y, width, height }) => ({ x, y, width, height }));
}

export function CookieCropper({
    imageUrl,
    regions: externalRegions,
    onRegionsChange,
    onSave: _onSave,
    onCancel: _onCancel,
    gridConfig,
    showGrid = false,
}: CookieCropperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Use controlled mode if regions prop is provided
    const isControlled = externalRegions !== undefined;

    // Internal state for uncontrolled mode
    const [internalRegions, setInternalRegions] = useState<CropRegion[]>([]);

    // Resolve which regions to use
    const regions = isControlled
        ? toInternalRegions(externalRegions)
        : internalRegions;

    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

    // Sync external regions to internal when they change
    useEffect(() => {
        if (isControlled && externalRegions) {
            setInternalRegions(toInternalRegions(externalRegions));
        }
    }, [isControlled, externalRegions]);

    // Handle image load to get dimensions
    const handleImageLoad = useCallback(() => {
        if (imageRef.current) {
            setImageDimensions({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight,
            });
        }
    }, []);

    // Update container dimensions on resize
    useEffect(() => {
        const updateContainerDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateContainerDimensions();
        window.addEventListener('resize', updateContainerDimensions);
        return () => window.removeEventListener('resize', updateContainerDimensions);
    }, []);

    // Update regions (works for both controlled and uncontrolled)
    const updateRegions = useCallback(
        (newRegions: CropRegion[]) => {
            if (isControlled && onRegionsChange) {
                onRegionsChange(toExternalRegions(newRegions));
            } else {
                setInternalRegions(newRegions);
            }
        },
        [isControlled, onRegionsChange]
    );

    // Remove a box
    const handleRemoveBox = useCallback(
        (id: string) => {
            const newRegions = regions.filter((r) => r.id !== id);
            updateRegions(newRegions);
        },
        [regions, updateRegions]
    );

    // Update box position
    const handleDragStop = useCallback(
        (id: string, x: number, y: number) => {
            const newRegions = regions.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        x: (x / containerDimensions.width) * imageDimensions.width,
                        y: (y / containerDimensions.height) * imageDimensions.height,
                    }
                    : r
            );
            updateRegions(newRegions);
        },
        [regions, containerDimensions, imageDimensions, updateRegions]
    );

    // Update box size
    const handleResizeStop = useCallback(
        (id: string, width: number, height: number, x: number, y: number) => {
            const newRegions = regions.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        x: (x / containerDimensions.width) * imageDimensions.width,
                        y: (y / containerDimensions.height) * imageDimensions.height,
                        width: (width / containerDimensions.width) * imageDimensions.width,
                        height: (height / containerDimensions.height) * imageDimensions.height,
                    }
                    : r
            );
            updateRegions(newRegions);
        },
        [regions, containerDimensions, imageDimensions, updateRegions]
    );

    // Calculate display scale
    const scaleX = containerDimensions.width / imageDimensions.width || 1;
    const scaleY = containerDimensions.height / imageDimensions.height || 1;

    // Generate grid lines
    const gridLines = [];
    if (showGrid && gridConfig) {
        // Horizontal lines (excluding 0 and 100%)
        for (let i = 1; i < gridConfig.rows; i++) {
            gridLines.push(
                <div
                    key={`h-${i}`}
                    className="absolute left-0 w-full border-t-2 border-cyan-400/70 pointer-events-none z-10 shadow-sm"
                    style={{ top: `${(i / gridConfig.rows) * 100}%` }}
                />
            );
        }
        // Vertical lines (excluding 0 and 100%)
        for (let i = 1; i < gridConfig.cols; i++) {
            gridLines.push(
                <div
                    key={`v-${i}`}
                    className="absolute top-0 h-full border-l-2 border-cyan-400/70 pointer-events-none z-10 shadow-sm"
                    style={{ left: `${(i / gridConfig.cols) * 100}%` }}
                />
            );
        }
    }

    return (
        <div className={styles.container}>
            {/* Image Container */}
            <div className={styles.imageContainer} ref={containerRef}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Cookie tray to crop"
                    className={styles.image}
                    onLoad={handleImageLoad}
                />

                {/* Grid Overlay */}
                {gridLines}

                {/* Crop Boxes */}
                {containerDimensions.width > 0 &&
                    imageDimensions.width > 0 &&
                    regions.map((region, index) => (
                        <Rnd
                            key={region.id}
                            data-testid={`crop-box-${index}`}
                            position={{
                                x: region.x * scaleX,
                                y: region.y * scaleY,
                            }}
                            size={{
                                width: region.width * scaleX,
                                height: region.height * scaleY,
                            }}
                            onDragStop={(_e, d) => handleDragStop(region.id, d.x, d.y)}
                            onResizeStop={(_e, _direction, ref, _delta, position) =>
                                handleResizeStop(
                                    region.id,
                                    ref.offsetWidth,
                                    ref.offsetHeight,
                                    position.x,
                                    position.y
                                )
                            }
                            bounds="parent"
                            className={styles.cropBox}
                            enableResizing={{
                                top: true,
                                right: true,
                                bottom: true,
                                left: true,
                                topRight: true,
                                bottomRight: true,
                                bottomLeft: true,
                                topLeft: true,
                            }}
                            // Ensure crop boxes are above grid
                            style={{ zIndex: 20 }}
                        >
                            <div className={styles.cropBoxContent}>
                                <span className={styles.cropBoxIndex}>{index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBox(region.id)}
                                    className={styles.deleteButton}
                                    aria-label="Delete region"
                                >
                                    ×
                                </button>
                            </div>
                        </Rnd>
                    ))}
            </div>
        </div>
    );
}
