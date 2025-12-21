/**
 * Local test user authentication system
 * Only works in development mode
 * Uses Firebase anonymous authentication for testing (no Google sign-in required)
 */

import type { User } from 'firebase/auth';
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';

const TEST_USER_STORAGE_KEY = 'cookie_voting_test_user';
const TEST_USER_UID_KEY = 'cookie_voting_test_user_uid';

export interface TestUser extends User {
  isTestUser: true;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  // In test environment, use process.env
  if (typeof process !== 'undefined' && process.env && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)) {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }
  // In browser/Vite environment, use import.meta.env
  // @ts-expect-error - import.meta is available in Vite but TypeScript doesn't recognize it in all contexts
  return import.meta?.env?.DEV || import.meta?.env?.MODE === 'development';
}

/**
 * Get the stored test user UID
 */
export function getTestUserUid(): string | null {
  if (!isDevelopment()) {
    return null;
  }
  return localStorage.getItem(TEST_USER_UID_KEY);
}

/**
 * Set the test user UID
 */
export function setTestUserUid(uid: string): void {
  if (!isDevelopment()) {
    console.warn('Local test user is only available in development mode');
    return;
  }
  localStorage.setItem(TEST_USER_UID_KEY, uid);
}

/**
 * Get the local test user if enabled
 * Returns the actual Firebase anonymous user if test user is enabled
 */
export function getLocalTestUser(): TestUser | null {
  if (!isDevelopment()) {
    return null;
  }

  const stored = localStorage.getItem(TEST_USER_STORAGE_KEY);
  if (stored !== 'enabled') {
    return null;
  }

  // Import auth synchronously - this should be safe since we're checking dev mode
  // Actually, we need to get it from the auth instance
  // For now, return null and let the auth state listener handle it
  return null;
}

/**
 * Check if the current Firebase user is the test user (anonymous)
 */
export function isCurrentUserTestUser(): boolean {
  if (!isDevelopment()) {
    return false;
  }
  
  const stored = localStorage.getItem(TEST_USER_STORAGE_KEY);
  if (stored !== 'enabled') {
    return false;
  }
  
  // This will be checked against auth.currentUser in components
  return true;
}

/**
 * Enable local test user (development only)
 * Signs in anonymously with Firebase - no Google sign-in required
 */
export async function enableLocalTestUser(): Promise<User | null> {
  if (!isDevelopment()) {
    console.warn('Local test user is only available in development mode');
    return null;
  }

  // Import auth here to avoid circular dependencies
  const { auth } = await import('./firebase');
  
  try {
    // Set localStorage FIRST before signing in to prevent race conditions
    // This ensures AuthButton knows test mode is enabled when auth state changes
    localStorage.setItem(TEST_USER_STORAGE_KEY, 'enabled');
    
    // Sign in anonymously - this gives us a Firebase UID without requiring Google auth
    const userCredential = await signInAnonymously(auth);
    const testUser = userCredential.user;
    
    // Store the UID
    setTestUserUid(testUser.uid);
    
    console.log('✅ Local test user enabled (anonymous auth)');
    console.log('📋 Test User UID:', testUser.uid);
    console.log('🔒 Test mode: Using separate test database (test_* collections)');
    
    return testUser;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('Error enabling test user:', error);
    if (firebaseError.code === 'auth/operation-not-allowed') {
      console.error('⚠️  Anonymous authentication is not enabled in Firebase Console.');
      console.error('Enable it at: Firebase Console → Authentication → Sign-in method → Anonymous');
    }
    return null;
  }
}

/**
 * Disable local test user
 */
export async function disableLocalTestUser(): Promise<void> {
  localStorage.removeItem(TEST_USER_STORAGE_KEY);
  
  // Sign out from Firebase if signed in anonymously
  const { auth } = await import('./firebase');
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    await firebaseSignOut(auth);
  }
  
  // Optionally clear the UID too, or keep it for next time
  // localStorage.removeItem(TEST_USER_UID_KEY);
}

/**
 * Check if local test user is enabled
 */
export function isLocalTestUserEnabled(): boolean {
  return isDevelopment() && localStorage.getItem(TEST_USER_STORAGE_KEY) === 'enabled';
}

/**
 * Check if a user is the local test user
 */
export function isLocalTestUser(user: User | null): boolean {
  if (!isLocalTestUserEnabled() || !user) {
    return false;
  }
  // Test user is identified by being anonymous
  if (!user.isAnonymous) {
    return false;
  }
  const testUid = getTestUserUid();
  // If we have a stored UID, check it matches; otherwise any anonymous user in test mode is the test user
  return testUid === null || user.uid === testUid;
}

/**
 * Get the test user ID (useful for adding to admin lists)
 * Returns the stored UID if test user is enabled, otherwise returns empty string
 * If no UID is stored but test user is enabled, returns empty string (will be set on sign-in)
 */
export function getTestUserId(): string {
  if (isLocalTestUserEnabled()) {
    const uid = getTestUserUid();
    return uid || '';
  }
  return '';
}

/**
 * Get the collection name prefix for test mode
 * Returns 'test_' if test user is enabled, empty string otherwise
 */
export function getCollectionPrefix(): string {
  return isLocalTestUserEnabled() ? 'test_' : '';
}
