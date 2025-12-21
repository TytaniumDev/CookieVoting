/**
 * Firebase Emulator Authentication Helper
 * Provides easy test user creation for development with emulators
 * 
 * In emulator mode, you can sign in with any email/password - the emulator
 * will automatically create the user if it doesn't exist.
 */

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, areEmulatorsConnected } from './firebase';

/**
 * Check if we're using emulators
 * Returns true only if emulators are actually connected, not just if we're in dev mode
 */
export function isUsingEmulator(): boolean {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (!isDevelopment) {
        return false;
    }
    
    // Check if emulators are explicitly disabled
    if (import.meta.env.VITE_USE_EMULATOR === 'false') {
        return false;
    }
    
    // First check if emulators were successfully connected (from firebase.ts)
    if (areEmulatorsConnected()) {
        return true;
    }
    
    // Fallback: Check if auth is actually connected to emulator
    // The emulator connection sets a config property
    try {
        const authDelegate = (auth as { _delegate?: { _config?: { emulator?: unknown }; _settings?: { host?: string } } })._delegate;
        const authConfig = authDelegate?._config;
        // Check if emulator is configured
        if (authConfig?.emulator) {
            return true;
        }
        // Also check if the host is localhost (emulator)
        const settings = authDelegate?._settings;
        if (settings?.host?.includes('localhost')) {
            return true;
        }
        // If we can't detect emulator connection, assume production
        // This allows Google sign-in to work when emulators aren't running
        return false;
    } catch {
        // If we can't check, assume production (allows Google sign-in)
        return false;
    }
}

/**
 * Sign in as a test user in emulator mode
 * In emulator mode, any email/password will work and auto-create the user
 * 
 * @param email - Email for test user (default: test@local.dev)
 * @param password - Password for test user (default: test123456)
 */
export async function signInAsTestUser(
    email: string = 'test@local.dev',
    password: string = 'test123456'
): Promise<import('firebase/auth').User> {
    if (!isUsingEmulator()) {
        throw new Error('Emulator auth is only available when using Firebase emulators. Make sure emulators are running: npm run emulators:start');
    }

    try {
        // Try to sign in first (user might already exist)
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Signed in as test user:', email);
        console.log('📋 Test User UID:', userCredential.user.uid);
        return userCredential.user;
    } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        
        // Check for network errors - emulator might not be running
        if (firebaseError.code === 'auth/network-request-failed') {
            const errorMsg = 'Firebase Auth Emulator is not running or not accessible.\n\n' +
                'Please start the emulators:\n' +
                '  npm run emulators:start:seed\n\n' +
                'Then try signing in again.';
            console.error('❌', errorMsg);
            throw new Error(errorMsg);
        }
        
        // If user doesn't exist, create it
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('✅ Created and signed in as test user:', email);
                console.log('📋 Test User UID:', userCredential.user.uid);
                return userCredential.user;
            } catch (createError: unknown) {
                const createFirebaseError = createError as { code?: string; message?: string };
                // Check for network errors when creating user too
                if (createFirebaseError.code === 'auth/network-request-failed') {
                    const errorMsg = 'Firebase Auth Emulator is not running or not accessible.\n\n' +
                        'Please start the emulators:\n' +
                        '  npm run emulators:start:seed\n\n' +
                        'Then try signing in again.';
                    console.error('❌', errorMsg);
                    throw new Error(errorMsg);
                }
                console.error('Error creating test user:', createError);
                throw new Error(`Failed to create test user: ${createFirebaseError.message || 'Unknown error'}`);
            }
        }
        throw error;
    }
}

/**
 * Sign out from emulator
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

