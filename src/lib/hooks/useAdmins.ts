import { useState, useEffect, useCallback } from 'react';
import { isGlobalAdmin } from '../firestore';
import { useAuth } from './useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export function useAdmins() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const status = await isGlobalAdmin(user.uid);
      setIsAdmin(status);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('Failed to verify admin permissions');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const add = async (email: string) => {
    try {
      const addAdminRole = httpsCallable(functions, 'addAdminRole');
      const result = await addAdminRole({ email });
      console.log('Admin added:', result.data);
    } catch (err: any) {
      console.error('Error adding admin:', err);
      throw new Error(err.message || 'Failed to add admin');
    }
  };

  const remove = async (email: string) => {
    try {
      const removeAdminRole = httpsCallable(functions, 'removeAdminRole');
      const result = await removeAdminRole({ email });
      console.log('Admin removed:', result.data);
    } catch (err: any) {
      console.error('Error removing admin:', err);
      throw new Error(err.message || 'Failed to remove admin');
    }
  };

  return { isAdmin, loading, error, add, remove, refresh: checkAdminStatus };
}
