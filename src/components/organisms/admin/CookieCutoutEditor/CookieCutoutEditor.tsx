import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CookieViewer, type DetectedCookie } from '../../CookieViewer/CookieViewer';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useDetectionJob } from '../../../../lib/hooks/useDetectionJob';
import { useDetectionResults } from '../../../../lib/hooks/useDetectionResults';
import { DetectionToolbar } from '../../../molecules/DetectionToolbar';
import { cn } from '../../../../lib/cn';

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
      <div className="flex flex-col gap-3 w-full h-full">
        <div className="flex flex-col items-center justify-center h-full text-[#cbd5e1] text-center p-4">
          <span className="text-5xl mb-3 block">🖼️</span>
          <p>No image to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full h-full" ref={containerRef}>
      {/* Toolbar (using DetectionToolbar molecule) */}
      <DetectionToolbar
        detectionCount={detectedCookies.length}
        isRegenerating={isRegenerating || isDetecting}
        isAddMode={isAddMode}
        onRegenerate={handleRegenerate}
        onToggleAddMode={handleToggleAddMode}
      />

      {error && <div className="text-danger text-sm">{error}</div>}

      {/* Image Container */}
      <div
        className={cn(
          'relative flex-1 min-h-[300px] bg-black/30 rounded-md overflow-hidden',
          isAddMode ? 'cursor-crosshair' : 'cursor-default',
        )}
        onClick={handleImageClick}
        role="presentation"
      >
        <div className="w-full h-full">
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
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-danger border-2 border-[#0a1628] rounded-full text-white text-xs font-bold cursor-pointer transition-all pointer-events-auto z-[25] hover:scale-110 hover:bg-[#b91c1c] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
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
