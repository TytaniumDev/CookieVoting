import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Your Firebase configuration is now securely stored in environment variables.
// You can get this from the Firebase Console: Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

// Validate that required config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('Firebase configuration is missing required values. Please check your environment variables.');
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-west1');

// Check if we should use emulators
// In development mode, automatically connect to emulators unless explicitly disabled
// This allows testing production database from localhost when emulators aren't running
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
// Auto-connect in dev mode unless explicitly disabled
const useEmulator = isDevelopment && import.meta.env.VITE_USE_EMULATOR !== 'false';

// Track if emulators are actually connected
let emulatorsConnected = false;

// Connect to emulators only if explicitly enabled
if (useEmulator) {
    try {
        // Check if emulators are already connected (avoid duplicate connections)
        const authDelegate = (auth as { _delegate?: { _config?: { emulator?: unknown } } })._delegate;
        if (!authDelegate?._config?.emulator) {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            console.log('✅ Connected to Firebase Auth Emulator');
            emulatorsConnected = true;
        } else {
            emulatorsConnected = true;
        }
    } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || '';
        if (!errorMessage.includes('already been initialized')) {
            console.warn('⚠️  Could not connect to Auth Emulator:', errorMessage);
            console.warn('   Using production Firebase Auth instead');
            console.warn('   To use emulators, set VITE_USE_EMULATOR=true and run: npm run emulators:start');
            emulatorsConnected = false;
        } else {
            emulatorsConnected = true;
        }
    }

    try {
        const dbDelegate = (db as { _delegate?: { _settings?: { host?: string } } })._delegate;
        if (!dbDelegate?._settings?.host?.includes('localhost')) {
            connectFirestoreEmulator(db, 'localhost', 8080);
            console.log('✅ Connected to Firestore Emulator');
        }
    } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || '';
        if (!errorMessage.includes('already been initialized')) {
            console.warn('⚠️  Could not connect to Firestore Emulator:', errorMessage);
            console.warn('   Using production Firestore instead');
        }
    }

    try {
        const storageDelegate = (storage as { _delegate?: { _host?: string } })._delegate;
        if (!storageDelegate?._host?.includes('localhost')) {
            connectStorageEmulator(storage, 'localhost', 9199);
            console.log('✅ Connected to Storage Emulator');
        }
    } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || '';
        if (!errorMessage.includes('already been initialized')) {
            console.warn('⚠️  Could not connect to Storage Emulator:', errorMessage);
            console.warn('   Using production Storage instead');
        }
    }

    try {
        const functionsDelegate = (functions as { _delegate?: { _url?: string } })._delegate;
        if (!functionsDelegate?._url?.includes('localhost')) {
            connectFunctionsEmulator(functions, 'localhost', 5001);
            console.log('✅ Connected to Functions Emulator');
        }
    } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || '';
        if (!errorMessage.includes('already been initialized')) {
            console.warn('⚠️  Could not connect to Functions Emulator:', errorMessage);
            console.warn('   Using production Functions instead');
        }
    }
} else {
    // Using production Firebase services
    if (isDevelopment) {
        console.log('🔧 Development mode: Using production Firebase services');
        console.log('   To use emulators, set VITE_USE_EMULATOR=true in your .env file');
    }
    console.log('Firebase Auth Domain:', firebaseConfig.authDomain);
}

// Export function to check if emulators are actually connected
export function areEmulatorsConnected(): boolean {
    return emulatorsConnected;
}
