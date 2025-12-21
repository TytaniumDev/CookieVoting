/**
 * Mock ID token generator for Firebase Authentication Emulator
 * Uses Firebase Admin SDK to create users and generate custom tokens
 * 
 * This allows us to programmatically authenticate users in tests
 * without requiring real credentials or OAuth flows.
 */

import type { Auth } from 'firebase/auth';
import { signInWithCustomToken } from 'firebase/auth';

/**
 * Interface for mock user properties
 */
export interface MockUserProperties {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  customClaims?: Record<string, unknown>;
}

/**
 * Create a mock user in the Authentication Emulator and sign in
 * 
 * This function uses the Firebase Admin SDK to:
 * 1. Create a user account in the emulator with the specified properties
 * 2. Generate a custom token for that user
 * 3. Sign in with that custom token
 * 4. Return the authenticated user
 * 
 * @param auth - Firebase Auth instance (must be connected to emulator)
 * @param properties - User properties including uid, email, etc.
 * @returns Authenticated Firebase User
 */
export async function createMockUserAndSignIn(
  auth: Auth,
  properties: MockUserProperties
): Promise<import('firebase/auth').User> {
  const { uid, email, email_verified, name, customClaims } = properties;

  // Import Firebase Admin SDK
  // Note: This requires firebase-admin to be installed
  const admin = await import('firebase-admin');

  // Initialize Admin SDK if not already initialized
  // Use the emulator project ID
  const projectId = process.env.VITE_PROJECT_ID || 'demo-test';
  
  if (!admin.apps.length) {
    // Initialize Admin SDK with emulator settings
    // The Admin SDK automatically uses emulators when FIREBASE_AUTH_EMULATOR_HOST is set
    admin.initializeApp({
      projectId: projectId,
    });
    
    // Ensure Admin SDK uses the emulator
    // This is set automatically via environment variable, but we can verify
    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorHost;
    }
  }

  const adminAuth = admin.auth();

  try {
    // Step 1: Create user in emulator via Admin SDK
    await adminAuth.createUser({
      uid: uid,
      email: email || `${uid}@test.local`,
      emailVerified: email_verified !== false,
      displayName: name,
    });

    // Step 2: Set custom claims if provided
    if (customClaims && Object.keys(customClaims).length > 0) {
      await adminAuth.setCustomUserClaims(uid, customClaims);
    }

    // Step 3: Generate custom token
    const customToken = await adminAuth.createCustomToken(uid, customClaims);

    // Step 4: Sign in with custom token
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    return userCredential.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    // If user already exists, try to get custom token and sign in
    if (firebaseError.code === 'auth/uid-already-exists') {
      try {
        const customToken = await adminAuth.createCustomToken(uid, customClaims);
        const userCredential = await signInWithCustomToken(auth, customToken);
        return userCredential.user;
      } catch (signInError) {
        throw new Error(`Failed to sign in existing user: ${signInError}`);
      }
    }
    throw error;
  }
}
