import { useState, useEffect } from 'react';
import { watchImageDetectionResults, getAllImageDetections } from '../firestore';
import { type DetectedCookie } from '../../components/organisms/CookieViewer/CookieViewer';

export function useImageDetection(imageUrl: string | null) {
  const [detectedCookies, setDetectedCookies] = useState<DetectedCookie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setDetectedCookies([]);
      return;
    }

    setLoading(true);
    const unsubscribe = watchImageDetectionResults(imageUrl, (results) => {
      setDetectedCookies(results || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [imageUrl]);

  return { detectedCookies, loading, error };
}

/**
 * Hook to fetch all detections at once (useful for audit or global lists)
 */
export function useAllDetections() {
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllImageDetections();
        setDetections(data);
        setError(null);
      } catch (err) {
        console.error('Error loading all detections:', err);
        setError('Failed to load detections');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { detections, loading, error };
}
