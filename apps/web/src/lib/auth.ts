import { paths } from '@cookie-voting/shared'
import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, usingEmulators } from './firebase.ts'
import { useSubscription, type Subscription } from './useSubscription.ts'

/** The signed-in user, or null. */
export function useAuthUser(): Subscription<User | null> {
  return useSubscription<User | null>(
    (onData, onError) => onAuthStateChanged(auth, onData, onError),
    'auth',
  )
}

/** Whether a signed-in Google user is on the admin allowlist (`admins/{email}`). */
export function useIsAdmin(user: User | null): Subscription<boolean> {
  const email = user?.isAnonymous ? null : (user?.email ?? null)
  return useSubscription<boolean>(
    email === null
      ? (onData) => {
          onData(false)
          return () => {}
        }
      : (onData, onError) =>
          onSnapshot(doc(db, paths.admin(email)), (snap) => onData(snap.exists()), onError),
    `admin/${email}`,
  )
}

/**
 * Google sign-in in a popup. Redirect sign-in breaks in browsers that block third-party
 * storage when the auth domain differs from the site's, which it does on web.app.
 */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}

declare global {
  interface Window {
    /** Emulator builds only: signs in as a Google user without the popup (E2E tests). */
    signInForTests?: (email: string) => Promise<void>
  }
}

if (usingEmulators) {
  window.signInForTests = async (email) => {
    // The auth emulator accepts unsigned ID tokens.
    const token = JSON.stringify({ sub: email, email, email_verified: true })
    await signInWithCredential(auth, GoogleAuthProvider.credential(token))
  }
}
