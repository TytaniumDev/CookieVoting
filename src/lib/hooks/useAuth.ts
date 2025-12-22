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
        const result = await getRedirectResult(auth);
        if (result && isMounted) {
          console.log('User signed in via redirect:', result.user.email);
          // The auth state will be updated by onAuthStateChanged below
        } else {
          console.log('No redirect result found');
        }
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError?.code !== 'auth/no-auth-event' && isMounted) {
          console.error('Error getting redirect result:', error);
        }
      }

      // Check current auth state
      const currentUser = auth.currentUser;
      console.log(
        'Current auth user:',
        currentUser
          ? currentUser.isAnonymous
            ? 'anonymous (test user)'
            : currentUser.email
          : 'none',
      );

      // Set up the auth state listener
      // This will fire immediately with the current user (including after redirect)
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (isMounted) {
          console.log(
            'Auth state changed:',
            user ? `${user.email || 'user'} (${user.uid})` : 'signed out',
          );
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

    console.log('Starting Google sign-in...');

    // Try popup first (more reliable in most browsers)
    try {
      console.log('Attempting popup sign-in...');
      const userCredential = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful');
      console.log('📋 Your User UID:', userCredential.user.uid);
      console.log('📧 Your Email:', userCredential.user.email);
      console.log('💡 Tip: Enable test user mode to use a separate test database');
      console.log(
        '🔧 To create events, add your UID to: Firebase Console → Firestore → system/admins → userIds array',
      );
    } catch (popupError: unknown) {
      const firebaseError = popupError as { code?: string; message?: string };
      // If popup is blocked or fails, fall back to redirect
      if (
        firebaseError?.code === 'auth/popup-blocked' ||
        firebaseError?.code === 'auth/popup-closed-by-user' ||
        firebaseError?.code === 'auth/cancelled-popup-request'
      ) {
        console.log('Popup blocked/failed, using redirect flow');
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
