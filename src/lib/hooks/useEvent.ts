import { useState, useEffect } from 'react';
import { getEvent, updateEventStatus } from '../firestore';
import { type VoteEvent } from '../types';

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<VoteEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      setLoading(true);
      try {
        const data = await getEvent(eventId);
        setEvent(data);
        setError(null);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  const setStatus = async (status: 'voting' | 'completed') => {
    if (!eventId) return;
    try {
      await updateEventStatus(eventId, status);
      setEvent(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error('Error updating event status:', err);
      throw err;
    }
  };

  return { event, loading, error, setStatus };
}
