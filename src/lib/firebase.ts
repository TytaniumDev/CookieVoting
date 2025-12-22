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
const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

if (!hasValidConfig) {
    console.warn('Firebase configuration is missing required values. Firebase services will not be available.');
    console.warn('This is expected in Storybook builds or when environment variables are not set.');
}

// Only initialize Firebase if we have valid config
// Otherwise, create stub services to prevent errors in Storybook/static builds
let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;
let auth: ReturnType<typeof getAuth>;
let storage: ReturnType<typeof getStorage>;
let functions: ReturnType<typeof getFunctions>;

if (hasValidConfig) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        functions = getFunctions(app, 'us-west1');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        // Fall through to stub initialization
        const stubConfig = {
            apiKey: 'demo-api-key',
            authDomain: 'demo.firebaseapp.com',
            projectId: 'demo-project',
            storageBucket: 'demo-project.appspot.com',
            messagingSenderId: '123456789',
            appId: '1:123456789:web:demo'
        };
        app = initializeApp(stubConfig, 'demo-app');
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        functions = getFunctions(app, 'us-west1');
        console.warn('Using stub Firebase configuration due to initialization error.');
    }
} else {
    // If config is invalid, create stub services to prevent errors
    // This prevents errors but services won't work (which is fine for Storybook)
    const stubConfig = {
        apiKey: 'demo-api-key',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:demo'
    };
    
    try {
        app = initializeApp(stubConfig, 'demo-app');
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        functions = getFunctions(app, 'us-west1');
        console.warn('Using stub Firebase configuration. Services will not function properly.');
    } catch (error) {
        // If even stub initialization fails, we'll get errors but at least we tried
        console.error('Failed to initialize stub Firebase:', error);
        throw error;
    }
}

export { db, auth, storage, functions };

// Check if we should use emulators
// In development mode, automatically connect to emulators unless explicitly disabled
// This allows testing production database from localhost when emulators aren't running
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
// Track if emulators are actually connected
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
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
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
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
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
            connectStorageEmulator(storage, '127.0.0.1', 9199);
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
            connectFunctionsEmulator(functions, '127.0.0.1', 5001);
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
