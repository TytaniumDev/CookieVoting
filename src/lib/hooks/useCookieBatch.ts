import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface CookieCandidate {
  id: string;
  storagePath: string;
  detectedLabel: string;
  confidence: number;
  votes: number;
  createdAt?: unknown;
}

export interface CookieBatch {
  id: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt?: unknown;
  originalImageRef?: string;
  totalCandidates?: number;
  paddingPercentage?: number;
  error?: string;
}

export interface UseCookieBatchResult {
  batch: CookieBatch | null;
  cookies: CookieCandidate[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to listen to a cookie batch and its candidates
 * Returns batch status and candidate cookies in real-time
 */
export function useCookieBatch(batchId: string | null): UseCookieBatchResult {
  const [batch, setBatch] = useState<CookieBatch | null>(null);
  const [cookies, setCookies] = useState<CookieCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!batchId) {
      setBatch(null);
      setCookies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Listen to batch document
    const batchRef = doc(db, 'cookie_batches', batchId);
    const batchUnsubscribe = onSnapshot(
      batchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBatch({ id: snapshot.id, ...snapshot.data() } as CookieBatch);
        } else {
          setBatch(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to batch:', err);
        setError(err as Error);
        setIsLoading(false);
      },
    );

    // Listen to candidates subcollection
    const candidatesRef = collection(db, 'cookie_batches', batchId, 'candidates');
    const candidatesUnsubscribe = onSnapshot(
      candidatesRef,
      (snapshot) => {
        const candidateData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CookieCandidate[];
        setCookies(candidateData);
      },
      (err) => {
        console.error('Error listening to candidates:', err);
        setError(err as Error);
      },
    );

    return () => {
      batchUnsubscribe();
      candidatesUnsubscribe();
    };
  }, [batchId]);

  return { batch, cookies, isLoading, error };
}
