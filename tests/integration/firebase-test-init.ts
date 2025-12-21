/**
 * Shared Firebase initialization for integration tests
 * Connects to Firebase Emulators for isolated testing
 * Ensures all test files use the same Firebase instances
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY || 'demo-api-key',
  authDomain: process.env.VITE_AUTH_DOMAIN || 'demo-test.firebaseapp.com',
  projectId: process.env.VITE_PROJECT_ID || 'demo-test',
  storageBucket: process.env.VITE_STORAGE_BUCKET || 'demo-test.appspot.com',
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_APP_ID || '1:123456789:web:abcdef',
};

// Emulator configuration
const USE_EMULATOR = process.env.FIREBASE_EMULATOR !== 'false'; // Default to true
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';

// Initialize Firebase app for testing (singleton pattern)
let testApp: ReturnType<typeof initializeApp> | null = null;
let emulatorsConnected = false;

function getTestApp() {
  if (!testApp) {
    testApp = initializeApp(firebaseConfig, 'test-app-integration');
  }
  return testApp;
}

// Initialize Firebase services
const app = getTestApp();
export const testAuth = getAuth(app);
export const testDb = getFirestore(app);
export const testStorage = getStorage(app);

// Connect to emulators if enabled
if (USE_EMULATOR && !emulatorsConnected) {
  try {
    // Connect Auth emulator
    connectAuthEmulator(testAuth, `http://${AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    
    // Connect Firestore emulator
    connectFirestoreEmulator(testDb, 'localhost', 8080);
    
    // Connect Storage emulator
    connectStorageEmulator(testStorage, 'localhost', 9199);
    
    emulatorsConnected = true;
    console.log('✅ Connected to Firebase Emulators');
    console.log(`   Auth: ${AUTH_EMULATOR_HOST}`);
    console.log(`   Firestore: ${FIRESTORE_EMULATOR_HOST}`);
    console.log(`   Storage: ${STORAGE_EMULATOR_HOST}`);
  } catch (error: unknown) {
    const errorMessage = (error as { message?: string })?.message || '';
    // If emulators are already connected, that's okay
    if (!errorMessage.includes('already been initialized')) {
      console.warn('⚠️  Failed to connect to emulators:', errorMessage);
      console.warn('   Make sure emulators are running: npm run emulators:start');
    }
  }
}

// Set environment variable for Admin SDK
if (USE_EMULATOR) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
}

