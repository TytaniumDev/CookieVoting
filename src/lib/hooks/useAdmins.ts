import { useState, useEffect, useCallback } from 'react';
import { isGlobalAdmin } from '../firestore';
import { useAuth } from './useAuth';
export function useAdmins() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    // Wait for auth to initialize
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await isGlobalAdmin(user.uid);
      setIsAdmin(status);
      setError(null);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('Failed to verify admin permissions');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return { isAdmin, loading, error, refresh: checkAdminStatus };
}
