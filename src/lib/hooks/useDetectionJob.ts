import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { functions, db } from '../firebase';

interface DetectionJobState {
  isDetecting: boolean;
  progress: string | null;
  currentJobId: string | null;
}

interface DetectionJobResult {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

interface UseDetectionJobReturn extends DetectionJobState {
  startDetection: () => Promise<void>;
  cancelDetection: () => Promise<void>;
  triggerSingleDetection: (imageUrl: string) => Promise<void>;
}

/**
 * Hook for managing cookie detection jobs.
 *
 * Handles starting, monitoring, and cancelling detection jobs.
 * Automatically watches for job progress updates via Firestore.
 *
 * @example
 * ```tsx
 * const { isDetecting, progress, startDetection, cancelDetection } = useDetectionJob({
 *   onComplete: (result) => console.log('Done!', result),
 *   onError: (error) => setError(error),
 * });
 * ```
 */
export function useDetectionJob(options: {
  onComplete?: (result: DetectionJobResult) => void;
  onError?: (error: string) => void;
  onStatusChange?: (message: string) => void;
  /** Only start watching if this is true (e.g., user is admin) */
  enabled?: boolean;
} = {}): UseDetectionJobReturn {
  const { onComplete, onError, onStatusChange, enabled = true } = options;

  const [state, setState] = useState<DetectionJobState>({
    isDetecting: false,
    progress: null,
    currentJobId: null,
  });

  // Check for running jobs on mount
  useEffect(() => {
    if (!enabled) return;

    const checkRunningJobs = async () => {
      try {
        const jobsRef = collection(db, 'detection_jobs');

        // Check for processing jobs first
        const processingQuery = query(jobsRef, where('status', '==', 'processing'), limit(1));
        const processingSnapshot = await getDocs(processingQuery);

        if (!processingSnapshot.empty) {
          const jobDoc = processingSnapshot.docs[0];
          setState({
            currentJobId: jobDoc.id,
            isDetecting: true,
            progress: 'Found running detection job. Watching progress...',
          });
          return;
        }

        // Check for queued jobs
        const queuedQuery = query(jobsRef, where('status', '==', 'queued'), limit(1));
        const queuedSnapshot = await getDocs(queuedQuery);

        if (!queuedSnapshot.empty) {
          const jobDoc = queuedSnapshot.docs[0];
          setState({
            currentJobId: jobDoc.id,
            isDetecting: true,
            progress: 'Found queued detection job. Watching progress...',
          });
        }
      } catch {
        // Silently ignore - user may not have access yet
      }
    };

    checkRunningJobs();
  }, [enabled]);

  // Watch job status when a job is active
  useEffect(() => {
    if (!state.currentJobId) return;

    const jobRef = doc(db, 'detection_jobs', state.currentJobId);
    const unsubscribe = onSnapshot(
      jobRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setState({ isDetecting: false, progress: null, currentJobId: null });
          return;
        }

        const jobData = snapshot.data();
        const status = jobData.status;
        const total = jobData.total || 0;
        const processed = jobData.processed || 0;
        const skipped = jobData.skipped || 0;
        const errors = jobData.errors || 0;
        const currentFile = jobData.currentFile || '';
        const currentIndex = jobData.currentIndex || 0;

        if (status === 'queued') {
          setState((prev) => ({ ...prev, progress: 'Job queued, starting soon...' }));
        } else if (status === 'processing') {
          if (total > 0) {
            const progressPercent = Math.round(((processed + skipped + errors) / total) * 100);
            setState((prev) => ({
              ...prev,
              progress:
                `Processing ${currentIndex}/${total}: ${currentFile}\n` +
                `Progress: ${progressPercent}% (${processed} processed, ${skipped} skipped, ${errors} errors)`,
            }));
          } else {
            setState((prev) => ({ ...prev, progress: 'Scanning for images...' }));
          }
        } else if (status === 'completed') {
          setState({ isDetecting: false, progress: null, currentJobId: null });
          onComplete?.({ total, processed, skipped, errors });
        } else if (status === 'cancelled') {
          setState({ isDetecting: false, progress: null, currentJobId: null });
          onStatusChange?.('Detection job cancelled');
        } else if (status === 'error') {
          setState({ isDetecting: false, progress: null, currentJobId: null });
          onError?.(`Detection failed: ${jobData.error || 'Unknown error'}`);
        }
      },
      (error) => {
        setState({ isDetecting: false, progress: null, currentJobId: null });
        onError?.(`Error watching job: ${error.message}`);
      },
    );

    return () => unsubscribe();
  }, [state.currentJobId, onComplete, onError, onStatusChange]);

  const startDetection = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isDetecting: true,
      progress: 'Starting detection job...',
    }));

    try {
      const detectAllImages = httpsCallable<
        Record<string, never>,
        { jobId: string; status: string; message: string }
      >(functions, 'detectAllImages');

      const result = await detectAllImages({});
      const data = result.data;

      if (data?.jobId) {
        if (data.status === 'already_running') {
          setState({
            currentJobId: data.jobId,
            isDetecting: true,
            progress: 'A detection job is already running. Watching progress...',
          });
        } else {
          setState({
            currentJobId: data.jobId,
            isDetecting: true,
            progress: 'Job started, waiting for progress...',
          });
        }
      } else {
        setState({ isDetecting: false, progress: null, currentJobId: null });
        onError?.('Failed to start detection job');
      }
    } catch (err) {
      setState({ isDetecting: false, progress: null, currentJobId: null });
      const errorMessage = err instanceof Error ? err.message : 'Failed to start detection job';
      onError?.(`Failed to start detection: ${errorMessage}`);
    }
  }, [onError]);

  const cancelDetection = useCallback(async () => {
    if (!state.currentJobId) return;

    try {
      const cancelDetectionJob = httpsCallable<{ jobId: string }, { success: boolean; message: string }>(
        functions,
        'cancelDetectionJob',
      );

      await cancelDetectionJob({ jobId: state.currentJobId });
      onStatusChange?.('Cancellation requested. The job will stop after processing the current image.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel detection job';
      onError?.(`Failed to cancel: ${errorMessage}`);
    }
  }, [state.currentJobId, onError, onStatusChange]);

  const triggerSingleDetection = useCallback(async (imageUrl: string) => {
    try {
      const detectCookiesWithGemini = httpsCallable(functions, 'detectCookiesWithGemini');
      await detectCookiesWithGemini({ imageUrl });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError?.(`Failed to regenerate: ${errorMessage}`);
    }
  }, [onError]);

  return {
    ...state,
    startDetection,
    cancelDetection,
    triggerSingleDetection,
  };
}
