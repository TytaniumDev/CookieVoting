/**
 * Test setup utilities for integration tests
 * Handles Firebase initialization and test user authentication
 * Uses Firebase Authentication Emulator with mock ID tokens
 */

// Mock localStorage for Node.js environment
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  (global as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;
}

// Set test mode environment variable
process.env.NODE_ENV = 'development';

// Import shared Firebase instances (initialized in firebase-test-init.ts)
import { testAuth, testDb, testStorage } from './firebase-test-init';
import type { User } from 'firebase/auth';

// Re-export for convenience
export { testAuth, testDb, testStorage };

// Import test utilities
import { setTestUserUid } from '../../src/lib/testAuth';
import { createMockUserAndSignIn, type MockUserProperties } from './mock-auth';

// Track created event IDs for cleanup
const createdEventIds: string[] = [];

/**
 * Setup test user: authenticate using Firebase Authentication Emulator with mock ID token
 * 
 * This function:
 * 1. Creates a mock user in the Authentication Emulator with a specific UID
 * 2. Signs in with that user using a custom token
 * 3. Ensures the user has admin privileges
 * 
 * @param userProperties - Optional custom user properties (defaults to test user)
 * @returns Authenticated Firebase User
 */
export async function setupTestUser(userProperties?: Partial<MockUserProperties>): Promise<User> {
  // Enable test user mode by setting localStorage flag
  // This allows getCollectionPrefix() to return 'test_' prefix
  if (typeof global.localStorage !== 'undefined') {
    global.localStorage.setItem('cookie_voting_test_user', 'enabled');
  }
  
  // Default test user properties
  const defaultUid = 'test-user-integration';
  const properties: MockUserProperties = {
    uid: userProperties?.uid || defaultUid,
    email: userProperties?.email || `${defaultUid}@test.local`,
    email_verified: userProperties?.email_verified !== false,
    name: userProperties?.name || 'Test User (Integration)',
    ...userProperties,
  };
  
  try {
    // Create mock user and sign in using emulator
    const user = await createMockUserAndSignIn(testAuth, properties);
    
    // Set test user UID for collection prefix logic
    setTestUserUid(user.uid);
    
    // Ensure test user is admin
    // Import ensureTestUserIsAdmin here so it uses the mocked firebase module
    const { ensureTestUserIsAdmin } = await import('../../src/lib/firestore');
    await ensureTestUserIsAdmin();
    
    console.log(`✅ Test user authenticated via emulator: ${user.uid}`);
    
    return user;
  } catch (error: unknown) {
    const errorMessage = (error as { message?: string })?.message || '';
    if (errorMessage.includes('emulator')) {
      throw new Error(
        `Failed to connect to Firebase Authentication Emulator. ` +
        `Make sure emulators are running: npm run emulators:start\n` +
        `Error: ${errorMessage}`
      );
    }
    throw error;
  }
}

/**
 * Track created event ID for cleanup
 */
export function trackEventId(eventId: string): void {
  createdEventIds.push(eventId);
}

/**
 * Cleanup all test events created during test run
 */
export async function cleanupTestEvents(): Promise<void> {
  const { deleteDoc, doc, collection, getDocs, writeBatch } = await import('firebase/firestore');
  
  for (const eventId of createdEventIds) {
    try {
      // Delete subcollections first
      const votesRef = collection(testDb, 'test_events', eventId, 'votes');
      const categoriesRef = collection(testDb, 'test_events', eventId, 'categories');
      
      const votesSnapshot = await getDocs(votesRef);
      const categoriesSnapshot = await getDocs(categoriesRef);
      
      const batch = writeBatch(testDb);
      
      votesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      categoriesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Delete event document
      await deleteDoc(doc(testDb, 'test_events', eventId));
    } catch (error) {
      console.error(`Failed to cleanup event ${eventId}:`, error);
    }
  }
  
  createdEventIds.length = 0;
}

/**
 * Wait for Firestore operations to complete
 * Useful for ensuring writes are committed before reads
 */
export async function waitForFirestore(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all tracked event IDs
 */
export function getTrackedEventIds(): string[] {
  return [...createdEventIds];
}
