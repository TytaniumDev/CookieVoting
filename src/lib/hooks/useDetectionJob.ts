import { useState, useCallback } from 'react';

interface UseDetectionJobOptions {
  onError?: (error: string) => void;
}

interface UseDetectionJobResult {
  triggerSingleDetection: (imageUrl: string) => Promise<void>;
  isDetecting: boolean;
}

/**
 * Stub hook for detection jobs.
 * This is a placeholder implementation for legacy code.
 */
export function useDetectionJob(options: UseDetectionJobOptions = {}): UseDetectionJobResult {
  const [isDetecting, setIsDetecting] = useState(false);

  const triggerSingleDetection = useCallback(
    async (_imageUrl: string): Promise<void> => {
      setIsDetecting(true);
      try {
        // Stub implementation - does nothing
        await Promise.resolve();
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : 'Detection failed');
      } finally {
        setIsDetecting(false);
      }
    },
    [options]
  );

  return {
    triggerSingleDetection,
    isDetecting,
  };
}
