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
    
    // Interaction state
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

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
            if (selectedId === id) setSelectedId(null);
        },
        [regions, updateRegions, selectedId]
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) {
                    handleRemoveBox(selectedId);
                }
            } else if (e.key === 'Escape') {
                setDrawStart(null);
                setDrawCurrent(null);
                setSelectedId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, handleRemoveBox]);

    // Mouse interactions for drawing
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drawing if clicking directly on the container/image/grid
        // (Rnd stops propagation, so this naturally handles it, but good to be safe)
        if (!containerRef.current || !imageDimensions.width) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setDrawStart({ x, y });
        setDrawCurrent({ x, y });
        setSelectedId(null); // Deselect when starting to draw
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!drawStart || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

        setDrawCurrent({ x, y });
    };

    const handleMouseUp = () => {
        if (!drawStart || !drawCurrent || !imageDimensions.width) {
            setDrawStart(null);
            setDrawCurrent(null);
            return;
        }

        const width = Math.abs(drawCurrent.x - drawStart.x);
        const height = Math.abs(drawCurrent.y - drawStart.y);

        // Minimum size threshold to avoid accidental clicks
        if (width > 10 && height > 10) {
            const x = Math.min(drawStart.x, drawCurrent.x);
            const y = Math.min(drawStart.y, drawCurrent.y);

            // Convert display coords to image coords
            const scaleX = imageDimensions.width / containerDimensions.width;
            const scaleY = imageDimensions.height / containerDimensions.height;

            const newRegion: CropRegion = {
                id: `region-${Date.now()}`, // Simple ID generation
                x: x * scaleX,
                y: y * scaleY,
                width: width * scaleX,
                height: height * scaleY,
            };

            updateRegions([...regions, newRegion]);
            setSelectedId(newRegion.id); // Auto-select new region
        }

        setDrawStart(null);
        setDrawCurrent(null);
    };

    // Update box position
    const handleDragStop = useCallback(
        (id: string, x: number, y: number) => {
            // Prevent drag from triggering selection if it was just a drag
            // But we actually want to select on drag start usually. 
            // Rnd handles onClick separately.
            
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
            <div 
                className={styles.imageContainer} 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // Cancel drawing if leaving
                data-testid="cropper-container"
            >
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Cookie tray to crop"
                    className={styles.image}
                    onLoad={handleImageLoad}
                    draggable={false} // Prevent native image dragging
                />

                {/* Grid Overlay */}
                {gridLines}

                {/* Drawing Preview Box */}
                {drawStart && drawCurrent && (
                    <div
                        className="absolute border-2 border-blue-500 bg-blue-500/20 z-30 pointer-events-none"
                        style={{
                            left: Math.min(drawStart.x, drawCurrent.x),
                            top: Math.min(drawStart.y, drawCurrent.y),
                            width: Math.abs(drawCurrent.x - drawStart.x),
                            height: Math.abs(drawCurrent.y - drawStart.y),
                        }}
                    />
                )}

                {/* Crop Boxes */}
                {containerDimensions.width > 0 &&
                    imageDimensions.width > 0 &&
                    regions.map((region, index) => {
                        const isSelected = selectedId === region.id;
                        const isSaved = region.isSaved;
                        
                        return (
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
                            onDragStop={(_e, d) => !isSaved && handleDragStop(region.id, d.x, d.y)}
                            onResizeStop={(_e, _direction, ref, _delta, position) =>
                                !isSaved && handleResizeStop(
                                    region.id,
                                    ref.offsetWidth,
                                    ref.offsetHeight,
                                    position.x,
                                    position.y
                                )
                            }
                            onClick={(e) => {
                                e.stopPropagation(); // Stop propagation to prevent drawing
                                if (!isSaved) setSelectedId(region.id);
                            }}
                            onDragStart={() => !isSaved && setSelectedId(region.id)} // Select on drag start
                            disableDragging={isSaved}
                            enableResizing={isSaved ? false : {
                                top: true,
                                right: true,
                                bottom: true,
                                left: true,
                                topRight: true,
                                bottomRight: true,
                                bottomLeft: true,
                                topLeft: true,
                            }}
                            bounds="parent"
                            className={`${styles.cropBox} ${isSaved ? 'border-green-500 bg-green-500/10 z-10' : (isSelected ? 'ring-2 ring-blue-500 z-40' : 'z-20')}`}
                            // Ensure crop boxes are above grid
                            style={{ zIndex: isSaved ? 10 : (isSelected ? 40 : 20) }}
                        >
                            <div className={styles.cropBoxContent}>
                                <span className={`${styles.cropBoxIndex} ${isSaved ? 'bg-green-500' : ''}`}>
                                    {isSaved ? '✓' : index + 1}
                                </span>
                                {!isSaved && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent box selection when clicking delete
                                            handleRemoveBox(region.id);
                                        }}
                                        className={styles.deleteButton}
                                        aria-label="Delete region"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </Rnd>
                    );
                })}
            </div>
        </div>
    );
}
