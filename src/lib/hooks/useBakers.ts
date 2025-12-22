import { useState, useEffect, useCallback } from 'react';
import { getBakers, addBaker, removeBaker } from '../firestore';
import { type CookieMaker } from '../types';

export function useBakers(eventId: string) {
  const [bakers, setBakers] = useState<CookieMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBakers = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await getBakers(eventId);
      setBakers(data);
      setError(null);
    } catch (err) {
      console.error('Error loading bakers:', err);
      setError('Failed to load bakers');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadBakers();
  }, [loadBakers]);

  const add = async (name: string) => {
    try {
      const newBaker = await addBaker(eventId, name);
      setBakers((prev) => [...prev, newBaker]);
      return newBaker;
    } catch (err) {
      console.error('Error adding baker:', err);
      throw err;
    }
  };

  const remove = async (bakerId: string) => {
    try {
      await removeBaker(eventId, bakerId);
      setBakers((prev) => prev.filter((b) => b.id !== bakerId));
    } catch (err) {
      console.error('Error removing baker:', err);
      throw err;
    }
  };

  return { bakers, loading, error, add, remove, refresh: loadBakers };
}
