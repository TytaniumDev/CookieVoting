import { create } from 'zustand';
import { auth } from '../firebase';
import {
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string | null;
  isAdmin: boolean;
  isAnonymous: boolean;
}

interface AuthState {
  user: UserData | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void; // Returns unsubscribe
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  signInAnonymously: async () => {
    set({ loading: true });
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      set({ loading: false }); // Reset loading on error
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await firebaseSignOut(auth);
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      set({ loading: false });
    }
  },

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Check for admin claim
        const tokenResult = await firebaseUser.getIdTokenResult();
        const isAdmin = !!tokenResult.claims.admin;

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
            isAdmin,
          },
          loading: false,
          initialized: true,
        });
      } else {
        set({
          user: null,
          loading: false,
          initialized: true,
        });
      }
    });

    return unsubscribe;
  }
}));
