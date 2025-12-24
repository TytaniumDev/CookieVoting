import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { isGlobalAdmin } from '../firestore';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAdminAuthOptions {
  /** Redirect to this path if not authenticated (default: '/') */
  redirectIfNotAuth?: string;
  /** Redirect to this path if not admin (default: null - no redirect) */
  redirectIfNotAdmin?: string;
  /** Whether to require admin access (default: true) */
  requireAdmin?: boolean;
}

/**
 * Hook for managing admin authentication state.
 *
 * Combines Firebase auth state monitoring with admin status checking.
 * Use this in admin pages to ensure proper access control.
 *
 * @example
 * ```tsx
 * const { user, isAdmin, isLoading, error } = useAdminAuth({
 *   redirectIfNotAuth: '/',
 *   redirectIfNotAdmin: '/admin',
 * });
 *
 * if (isLoading) return <Loading />;
 * if (!isAdmin) return <AccessDenied error={error} />;
 * ```
 */
export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const {
    redirectIfNotAuth = '/',
    redirectIfNotAdmin = null,
    requireAdmin = true,
  } = options;

  const navigate = useNavigate();
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: null,
  });

  const checkAccess = useCallback(async (user: User | null) => {
    // Check if user is signed in
    const isSignedIn = user && (user.email || (user.providerData && user.providerData.length > 0));

    if (!isSignedIn) {
      if (redirectIfNotAuth) {
        navigate(redirectIfNotAuth, { replace: true });
      }
      setState({
        user: null,
        isAdmin: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // If we don't require admin, just confirm user is authenticated
    if (!requireAdmin) {
      setState({
        user,
        isAdmin: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check admin status
    try {
      const adminStatus = await isGlobalAdmin(user.uid);
      
      if (!adminStatus && redirectIfNotAdmin) {
        navigate(redirectIfNotAdmin, { replace: true });
      }

      setState({
        user,
        isAdmin: adminStatus,
        isLoading: false,
        error: adminStatus ? null : 'You do not have admin access. Please contact a site administrator.',
      });
    } catch {
      setState({
        user,
        isAdmin: false,
        isLoading: false,
        error: 'Failed to verify admin permissions',
      });
    }
  }, [navigate, redirectIfNotAuth, redirectIfNotAdmin, requireAdmin]);

  useEffect(() => {
    // Check immediately with current user
    checkAccess(auth.currentUser);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkAccess(user);
    });

    return () => unsubscribe();
  }, [checkAccess]);

  return state;
}
