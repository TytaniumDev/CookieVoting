/**
 * Integration tests for event CRUD operations
 * Tests Firebase operations programmatically with real Firebase connection
 */

// Mock firebase.ts module BEFORE importing firestore functions
// Use shared Firebase instances from firebase-test-init
jest.mock('../../src/lib/firebase', async () => {
  const firebaseTestInit = await import('./firebase-test-init');
  return {
    auth: firebaseTestInit.testAuth,
    db: firebaseTestInit.testDb,
    storage: firebaseTestInit.testStorage,
  };
});

// Import test setup
import { testAuth, testDb } from './setup';

// Now import firestore functions (they will use mocked firebase instances)
import { 
  createEvent, 
  getEvent, 
  updateEventStatus, 
  deleteEvent,
  getAllEvents 
} from '../../src/lib/firestore';
import { 
  setupTestUser, 
  cleanupTestEvents, 
  trackEventId, 
  waitForFirestore
} from './setup';
import { doc, getDoc } from 'firebase/firestore';

describe('Event Operations Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Setup test user and ensure admin status
    const user = await setupTestUser();
    testUserId = user.uid;
    console.log('Test user authenticated:', testUserId);
  });

  afterAll(async () => {
    // Cleanup all test events
    await cleanupTestEvents();
    
    // Sign out test user
    if (testAuth.currentUser) {
      await testAuth.signOut();
    }
  });

  describe('createEvent', () => {
    it('should create an event in test_events collection with correct data', async () => {
      const eventName = 'Test Event - Create';
      
      const event = await createEvent(eventName);
      trackEventId(event.id);
      
      // Wait for Firestore to commit
      await waitForFirestore();
      
      // Verify event was created in Firestore
      const eventDocRef = doc(testDb, 'test_events', event.id);
      const eventDoc = await getDoc(eventDocRef);
      
      expect(eventDoc.exists()).toBe(true);
      const eventData = eventDoc.data();
      
      expect(eventData).toMatchObject({
        id: event.id,
        name: eventName,
        status: 'voting',
        adminCode: expect.any(String),
        createdAt: expect.any(Number),
      });
      
      expect(eventData?.adminCode).toHaveLength(8); // UUID first segment
      expect(eventData?.createdAt).toBeGreaterThan(0);
    });

    it('should create event with unique IDs', async () => {
      const event1 = await createEvent('Test Event 1');
      const event2 = await createEvent('Test Event 2');
      
      trackEventId(event1.id);
      trackEventId(event2.id);
      
      expect(event1.id).not.toBe(event2.id);
      expect(event1.adminCode).not.toBe(event2.adminCode);
    });
  });

  describe('getEvent', () => {
    it('should retrieve created event by ID', async () => {
      const eventName = 'Test Event - Get';
      const createdEvent = await createEvent(eventName);
      trackEventId(createdEvent.id);
      
      await waitForFirestore();
      
      const retrievedEvent = await getEvent(createdEvent.id);
      
      expect(retrievedEvent).not.toBeNull();
      expect(retrievedEvent?.id).toBe(createdEvent.id);
      expect(retrievedEvent?.name).toBe(eventName);
      expect(retrievedEvent?.status).toBe('voting');
    });

    it('should return null for non-existent event', async () => {
      const nonExistentId = 'non-existent-event-id';
      const event = await getEvent(nonExistentId);
      
      expect(event).toBeNull();
    });
  });

  describe('updateEventStatus', () => {
    it('should update event status from voting to completed', async () => {
      const event = await createEvent('Test Event - Update Status');
      trackEventId(event.id);
      
      await waitForFirestore();
      
      // Update status to completed
      await updateEventStatus(event.id, 'completed');
      await waitForFirestore();
      
      // Verify status was updated
      const updatedEvent = await getEvent(event.id);
      expect(updatedEvent?.status).toBe('completed');
      
      // Verify in Firestore directly
      const eventDocRef = doc(testDb, 'test_events', event.id);
      const eventDoc = await getDoc(eventDocRef);
      expect(eventDoc.data()?.status).toBe('completed');
    });

    it('should update event status from completed back to voting', async () => {
      const event = await createEvent('Test Event - Update Status Back');
      trackEventId(event.id);
      
      await waitForFirestore();
      
      // Update to completed first
      await updateEventStatus(event.id, 'completed');
      await waitForFirestore();
      
      // Update back to voting
      await updateEventStatus(event.id, 'voting');
      await waitForFirestore();
      
      // Verify status was updated back
      const updatedEvent = await getEvent(event.id);
      expect(updatedEvent?.status).toBe('voting');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event and all subcollections', async () => {
      const event = await createEvent('Test Event - Delete');
      const eventId = event.id;
      
      // Don't track this event since we're deleting it
      await waitForFirestore();
      
      // Verify event exists
      const beforeDelete = await getEvent(eventId);
      expect(beforeDelete).not.toBeNull();
      
      // Delete event
      await deleteEvent(eventId);
      await waitForFirestore();
      
      // Verify event is deleted
      const afterDelete = await getEvent(eventId);
      expect(afterDelete).toBeNull();
      
      // Verify Firestore document is deleted
      const eventDocRef = doc(testDb, 'test_events', eventId);
      const eventDoc = await getDoc(eventDocRef);
      expect(eventDoc.exists()).toBe(false);
    });
  });

  describe('getAllEvents', () => {
    it('should retrieve all events including newly created ones', async () => {
      // Get initial count
      const initialEvents = await getAllEvents();
      const initialCount = initialEvents.length;
      
      // Create new events
      const event1 = await createEvent('Test Event - GetAll 1');
      const event2 = await createEvent('Test Event - GetAll 2');
      trackEventId(event1.id);
      trackEventId(event2.id);
      
      await waitForFirestore();
      
      // Get all events again
      const allEvents = await getAllEvents();
      
      // Should have at least 2 more events
      expect(allEvents.length).toBeGreaterThanOrEqual(initialCount + 2);
      
      // Verify our events are in the list
      const eventIds = allEvents.map(e => e.id);
      expect(eventIds).toContain(event1.id);
      expect(eventIds).toContain(event2.id);
    });
  });

  describe('Integration Flow: Create → Modify → Delete', () => {
    it('should complete full CRUD cycle', async () => {
      // Create
      const event = await createEvent('Test Event - Full Flow');
      trackEventId(event.id);
      await waitForFirestore();
      
      expect(event.status).toBe('voting');
      
      // Modify
      await updateEventStatus(event.id, 'completed');
      await waitForFirestore();
      
      const modifiedEvent = await getEvent(event.id);
      expect(modifiedEvent?.status).toBe('completed');
      
      // Modify back
      await updateEventStatus(event.id, 'voting');
      await waitForFirestore();
      
      const revertedEvent = await getEvent(event.id);
      expect(revertedEvent?.status).toBe('voting');
      
      // Delete
      await deleteEvent(event.id);
      await waitForFirestore();
      
      const deletedEvent = await getEvent(event.id);
      expect(deletedEvent).toBeNull();
      
      // Remove from tracking since we deleted it
      const { getTrackedEventIds } = await import('./setup');
      const trackedIds = getTrackedEventIds();
      const index = trackedIds.indexOf(event.id);
      if (index > -1) {
        trackedIds.splice(index, 1);
      }
    });
  });
});

