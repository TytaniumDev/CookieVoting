import { useState, useEffect } from 'react';
import type { DetectedCookie } from '../types';

/**
 * Stub hook for detection results.
 * This is a placeholder implementation for legacy code.
 * @param imageUrl - The image URL to watch for detections
 * @returns DetectedCookie[] or null
 */
export function useDetectionResults(imageUrl: string): DetectedCookie[] | null {
  const [detections, setDetections] = useState<DetectedCookie[] | null>(null);

  useEffect(() => {
    // Stub implementation - returns null (no detections)
    setDetections(null);
  }, [imageUrl]);

  return detections;
}
