/**
 * CookieCropperPage Component
 *
 * Main orchestrator for the Cookie Cropper tool.
 * Handles:
 * - Image upload/selection
 * - Grid configuration state
 * - Responsive layout (Desktop sidebar vs Mobile drawer)
 * - Integration with blob detection and slicing
 * - Visual grid overlay
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMediaQuery } from '../../../../lib/hooks/useMediaQuery';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { FloatingPalette, MobileDrawer, EmptyState } from './components';
import { CookieCropper } from './CookieCropper';
import { detectBlobsFromImage } from './blobDetection';
import { detectCookiesGemini } from '../../../../lib/cookieDetectionGemini';
import { sliceImage, generateGrid, clampRegion, validateRegion, type SliceRegion, type GridConfig } from './cropUtils';
import { cn } from '../../../../lib/cn';
import styles from './CookieCropperPage.module.css';

export interface CookieCropperPageProps {
    /** Called when cookies are saved */
    onSave: (data: { blob: Blob; region: SliceRegion }[]) => void;
    /** Called when user cancels/exits */
    onCancel: () => void;
    /** Optional initial image URL */
    initialImageUrl?: string;
    /** Optional category name to display in header */
    categoryName?: string;
    /** Optional event ID for loading existing crops */
    eventId?: string;
    /** Optional category ID for loading existing crops */
    categoryId?: string;
}

export function CookieCropperPage({
    onSave,
    onCancel,
    initialImageUrl,
    categoryName,
    eventId,
    categoryId,
}: CookieCropperPageProps) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const imageRef = useRef<HTMLImageElement>(null);
    const { 
        subscribeToCroppedCookies, 
        unsubscribeFromCroppedCookies, 
        getCroppedCookiesForCategory,
        images: storeImages 
    } = useImageStore();

    // State
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [regions, setRegions] = useState<SliceRegion[]>([]);
    const [gridConfig, setGridConfig] = useState<GridConfig>({ rows: 2, cols: 3, padding: 0 });
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop sidebar state

    // Load existing crops
    useEffect(() => {
        if (!eventId || !categoryId) return;

        subscribeToCroppedCookies(eventId, categoryId);
        
        return () => {
            unsubscribeFromCroppedCookies(categoryId);
        };
    }, [eventId, categoryId, subscribeToCroppedCookies, unsubscribeFromCroppedCookies]);

    // Sync existing crops to regions
    useEffect(() => {
        if (!categoryId) return;

        // Get cookies from store
        const existingCookies = getCroppedCookiesForCategory(categoryId);
        
        if (existingCookies.length === 0) return;

        setRegions(prevRegions => {
            // Convert existing cookies to regions
            const savedRegions: SliceRegion[] = existingCookies
                .filter((c): c is typeof c & { cropRegion: NonNullable<typeof c.cropRegion> } => !!c.cropRegion) // Only those with crop data
                .map(c => ({
                    ...c.cropRegion,
                    isSaved: true,
                    savedImageId: c.id
                }));

            // Merge with current regions, avoiding duplicates
            // We keep all user-added regions (isSaved undefined/false)
            const userRegions = prevRegions.filter(r => !r.isSaved);
            
            // For saved regions, we replace the set
            // This ensures if a crop is deleted elsewhere, it disappears here (due to subscription)
            // But if we want to allow editing saved ones... simple overwrite is safer for "View" mode
            return [...savedRegions, ...userRegions];
        });
    }, [storeImages, categoryId, getCroppedCookiesForCategory]);

    // Handle file upload
    const handleFileSelect = useCallback((file: File) => {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageUrl(e.target?.result as string);
            // Don't clear regions if we are just reloading the same image, 
            // but here we are selecting a NEW file, so yes, clear regions.
            // Wait, if we are editing an existing category, we shouldn't be uploading a NEW image usually?
            // The "EmptyState" is only shown if !imageUrl.
            // If passed initialImageUrl, we skip EmptyState.
            setRegions([]);
            setIsUploading(false);
        };
        reader.onerror = () => {
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    }, []);

    // Handle image load
    const handleImageLoad = useCallback(() => {
        if (imageRef.current) {
            setImageDimensions({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight,
            });
        }
    }, []);

    // Apply grid configuration
    const handleApplyGrid = useCallback(() => {
        if (imageDimensions.width === 0 || imageDimensions.height === 0) return;

        const { rows, cols, padding } = gridConfig;
        const paddingPx = Math.round((padding / 100) * Math.min(imageDimensions.width, imageDimensions.height));

        const baseRegions = generateGrid(rows, cols, imageDimensions.width, imageDimensions.height);

        // Apply padding to each region
        const paddedRegions = baseRegions.map((region) => ({
            x: region.x + paddingPx,
            y: region.y + paddingPx,
            width: Math.max(1, region.width - paddingPx * 2),
            height: Math.max(1, region.height - paddingPx * 2),
        }));

        setRegions(prev => {
            // Keep saved regions, replace unsaved ones with grid
            const saved = prev.filter(r => r.isSaved);
            return [...saved, ...paddedRegions];
        });
    }, [gridConfig, imageDimensions]);

    // Auto-detect blobs (Gemini first, then Blob fallback)
    const handleAutoDetect = useCallback(async () => {
        if (!imageRef.current || isDetecting || !imageUrl) return;

        setIsDetecting(true);
        setDetectionStatus('Detecting with AI...');
        
        try {
            // Try Gemini detection first
            console.log('Attempting Gemini detection...');
            const detectedCookies = await detectCookiesGemini(imageUrl);
            
            if (detectedCookies && detectedCookies.length > 0) {
                // Convert Gemini (percentage center) to SliceRegion (pixel top-left)
                const newRegions: SliceRegion[] = detectedCookies.map(cookie => {
                    // Gemini coords are 0-100 percentages
                    const widthPx = (cookie.width / 100) * imageDimensions.width;
                    const heightPx = (cookie.height / 100) * imageDimensions.height;
                    
                    // Center X/Y to Top-Left X/Y
                    const centerX_Px = (cookie.x / 100) * imageDimensions.width;
                    const centerY_Px = (cookie.y / 100) * imageDimensions.height;
                    
                    const x = centerX_Px - (widthPx / 2);
                    const y = centerY_Px - (heightPx / 2);
                    
                    return {
                        x: Math.round(x),
                        y: Math.round(y),
                        width: Math.round(widthPx),
                        height: Math.round(heightPx)
                    };
                });
                
                setRegions(prev => {
                    const saved = prev.filter(r => r.isSaved);
                    return [...saved, ...newRegions];
                });
                setDetectionStatus(`Found ${newRegions.length} cookies with AI`);
                setTimeout(() => setDetectionStatus(null), 3000);
                return; // Success!
            }
            
            throw new Error('No cookies found with Gemini');
        } catch (geminiError) {
            console.warn('Gemini detection failed, falling back to local blob detection:', geminiError);
            setDetectionStatus('AI failed, trying local detection...');
            
            try {
                // Fallback to local blob detection
                const detectedBlobs = await detectBlobsFromImage(imageRef.current);
                setRegions(prev => {
                    const saved = prev.filter(r => r.isSaved);
                    return [...saved, ...detectedBlobs];
                });
                setDetectionStatus(`Found ${detectedBlobs.length} cookies (Local fallback)`);
            } catch (blobError) {
                console.error('All detection methods failed:', blobError);
                setDetectionStatus('Detection failed');
            }
        } finally {
            setIsDetecting(false);
            setTimeout(() => setDetectionStatus(null), 3000);
        }
    }, [isDetecting, imageUrl, imageDimensions]);

    // Save cookies
    const handleSave = useCallback(async () => {
        // Filter out already saved regions
        const unsavedRegions = regions.filter(r => !r.isSaved);

        if (!imageRef.current || unsavedRegions.length === 0) {
            // Nothing new to save
            if (regions.some(r => r.isSaved)) {
                // If we have saved regions, user might just want to close
                onSave([]); 
            }
            return;
        }

        setIsSaving(true);
        try {
            const imageWidth = imageRef.current.naturalWidth;
            const imageHeight = imageRef.current.naturalHeight;

            // Pre-process regions to match sliceImage logic so we can zip them
            const validRegions = unsavedRegions
                .map(r => clampRegion(r, imageWidth, imageHeight))
                .filter(r => validateRegion(r, imageWidth, imageHeight));

            if (validRegions.length === 0) {
                setIsSaving(false);
                return;
            }

            const blobs = await sliceImage(imageRef.current, validRegions);
            
            // Zip blobs with regions
            const result = blobs.map((blob, i) => ({
                blob,
                region: validRegions[i]
            }));

            onSave(result);
        } catch (error) {
            console.error('Slice failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [regions, onSave]);

    // Handle region changes from CookieCropper
    const handleRegionsChange = useCallback((newRegions: SliceRegion[]) => {
        setRegions(newRegions);
    }, []);

    // Open mobile drawer when tapping FAB
    const handleOpenDrawer = useCallback(() => {
        setIsDrawerOpen(true);
    }, []);

    // Apply grid when dimensions first become available
    useEffect(() => {
        if (imageDimensions.width > 0 && regions.length === 0) {
            handleApplyGrid();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageDimensions]);

    // Title to display
    const displayTitle = categoryName || 'Cookie Cropper';

    // Render empty state if no image
    if (!imageUrl) {
        return (
            <div className={styles.containerFullPage}>
                <header className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-white/10 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2",
                            "bg-transparent border border-white/20 rounded-lg",
                            "text-white/80 text-sm font-medium",
                            "hover:bg-white/5 hover:border-white/30",
                            "transition-colors"
                        )}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-white/90 flex-1">{displayTitle}</h1>
                </header>
                <main className={styles.main}>
                    <EmptyState onFileSelect={handleFileSelect} isUploading={isUploading} />
                </main>
            </div>
        );
    }

    return (
        <div className={styles.containerFullPage}>
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-white/10 flex-shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2",
                        "bg-transparent border border-white/20 rounded-lg",
                        "text-white/80 text-sm font-medium",
                        "hover:bg-white/5 hover:border-white/30",
                        "transition-colors"
                    )}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-xl font-semibold text-white/90 flex-1">{displayTitle}</h1>
                {detectionStatus && (
                    <span className="text-sm text-blue-200 bg-blue-900/30 px-3 py-1.5 rounded-lg animate-pulse">
                        {detectionStatus}
                    </span>
                )}
                <span className="text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-lg">
                    {regions.length} {regions.length === 1 ? 'region' : 'regions'}
                </span>
            </header>

            {/* Main content area - flex container for canvas and sidebar */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Canvas area - adjusts width based on sidebar */}
                <main
                    className={cn(
                        "flex-1 relative flex items-center justify-center overflow-hidden transition-all duration-300",
                        !isMobile && isSidebarOpen && "mr-[320px]"
                    )}
                >
                    {/* Hidden image ref for detection/slicing */}
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt=""
                        className={styles.hiddenImage}
                        onLoad={handleImageLoad}
                        crossOrigin="anonymous"
                    />

                    {/* Visual cropper with grid overlay */}
                    <CookieCropper
                        imageUrl={imageUrl}
                        regions={regions}
                        onRegionsChange={handleRegionsChange}
                        onSave={handleSave}
                        onCancel={onCancel}
                        gridConfig={gridConfig}
                        showGrid={true}
                    />
                </main>

                {/* Desktop: Fixed Sidebar */}
                {!isMobile && (
                    <FloatingPalette
                        config={gridConfig}
                        onChange={setGridConfig}
                        onApply={handleApplyGrid}
                        onAutoDetect={handleAutoDetect}
                        onSave={handleSave}
                        isDetecting={isDetecting}
                        isSaving={isSaving}
                        isOpen={isSidebarOpen}
                        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                )}

                {/* Mobile: FAB to open drawer */}
                {isMobile && (
                    <button
                        type="button"
                        onClick={handleOpenDrawer}
                        aria-label="Open grid controls"
                        className={cn(
                            "fixed bottom-5 right-5 w-14 h-14",
                            "flex items-center justify-center",
                            "bg-gradient-to-r from-primary-600 to-primary-500",
                            "border-none rounded-full",
                            "text-white text-2xl",
                            "cursor-pointer",
                            "shadow-lg shadow-primary-900/40",
                            "transition-transform hover:scale-105 active:scale-95",
                            "z-50"
                        )}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}

                {/* Mobile: Drawer */}
                {isMobile && (
                    <MobileDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        config={gridConfig}
                        onChange={setGridConfig}
                        onApply={handleApplyGrid}
                        onAutoDetect={handleAutoDetect}
                        onSave={handleSave}
                        isDetecting={isDetecting}
                        isSaving={isSaving}
                    />
                )}
            </div>
        </div>
    );
}
