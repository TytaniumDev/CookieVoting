import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Custom hook for managing Firebase authentication state and operations
 *
 * This hook provides:
 * - Current user state
 * - Loading state
 * - Sign in and sign out functions
 * - Automatic auth state monitoring
 *
 * @returns Object containing user, loading state, and auth functions
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check for redirect result first, BEFORE setting up auth state listener
    const initializeAuth = async () => {
      try {
        await getRedirectResult(auth);
        // The auth state will be updated by onAuthStateChanged below
      } catch (error: unknown) {
        // Ignore auth/no-auth-event - it's normal when there's no redirect
        const firebaseError = error as { code?: string };
        if (firebaseError?.code !== 'auth/no-auth-event') {
          // Silent fail - auth state listener will handle the current state
        }
      }

      // Set up the auth state listener
      // This will fire immediately with the current user (including after redirect)
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (isMounted) {
          setUser(user);
          setLoading(false);
        }
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    // Request additional scopes for profile information
    provider.addScope('profile');
    provider.addScope('email');

    // Try popup first (more reliable in most browsers)
    try {
      await signInWithPopup(auth, provider);
    } catch (popupError: unknown) {
      const firebaseError = popupError as { code?: string; message?: string };
      // If popup is blocked or fails, fall back to redirect
      if (
        firebaseError?.code === 'auth/popup-blocked' ||
        firebaseError?.code === 'auth/popup-closed-by-user' ||
        firebaseError?.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        // signInWithRedirect doesn't return, it redirects the page
        return;
      }
      throw popupError;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    await signOut(auth);
  };

  return {
    user,
    loading,
    signIn,
    signOut: handleSignOut,
  };
}
