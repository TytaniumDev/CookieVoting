import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { ProcessingStatus } from '../firestore';

export interface ProcessingStatusWithError {
  status: ProcessingStatus;
  errorMessage: string | null;
}

/**
 * Hook to monitor batch processing status for a category
 * @param batchId - Batch ID from category.batchId
 * @returns ProcessingStatusWithError object with status and errorMessage
 */
export function useCategoryProcessing(batchId: string | null): ProcessingStatusWithError {
  const [status, setStatus] = useState<ProcessingStatus>('not_processed');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) {
      setStatus('not_processed');
      setErrorMessage(null);
      return;
    }

    const batchRef = doc(db, 'cookie_batches', batchId);
    const unsubscribe = onSnapshot(
      batchRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // If batchId is present but doc doesn't exist yet, it's initializing/uploading
          setStatus('in_progress');
          setErrorMessage(null);
          return;
        }

        const batch = snapshot.data();

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'useCategoryProcessing.ts:30',
            message: 'batch status update',
            data: { batchId, batchStatus: batch.status, batchError: batch.error },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          }),
        }).catch(() => {});
        // #endregion

        if (batch.status === 'ready') {
          setStatus('processed');
          setErrorMessage(null);
        } else if (batch.status === 'error') {
          setStatus('error');
          setErrorMessage(batch.error || 'Unknown error occurred');
        } else if (batch.status === 'review_required') {
          setStatus('review_required');
          setErrorMessage(null);
        } else {
          setStatus('in_progress');
          setErrorMessage(null);
        }
      },
      (error) => {
        console.error('Error listening to batch:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to monitor batch status');
      },
    );

    return unsubscribe;
  }, [batchId]);

  return { status, errorMessage };
}
