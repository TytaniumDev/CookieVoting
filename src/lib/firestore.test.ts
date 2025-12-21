/**
 * Automated tests for Firestore operations with test user
 * Tests event creation and deletion with proper admin permissions
 */

import { 
  createEvent, 
  deleteEvent, 
  ensureTestUserIsAdmin,
} from './firestore';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { isLocalTestUserEnabled } from './testAuth';

// Mock Firebase modules
jest.mock('./firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  storage: {},
}));

jest.mock('./testAuth', () => ({
  isLocalTestUserEnabled: jest.fn(() => true),
  enableLocalTestUser: jest.fn(),
  signInTestUser: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn(),
  })),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('./storage', () => ({
  deleteFolder: jest.fn(),
}));

describe('Firestore operations with test user', () => {
  const mockUserId = 'test-anonymous-user-123';
  const mockEventId = 'test-event-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth.currentUser as anonymous test user
    (auth as { currentUser: { uid: string; isAnonymous: boolean } | null }).currentUser = {
      uid: mockUserId,
      isAnonymous: true,
    };

    // Mock isLocalTestUserEnabled
    (isLocalTestUserEnabled as jest.Mock).mockReturnValue(true);
  });

  describe('ensureTestUserIsAdmin', () => {
    it('should create admins document if it does not exist', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => false),
      };

      (doc as jest.Mock).mockReturnValue(mockAdminsDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await ensureTestUserIsAdmin();

      expect(doc).toHaveBeenCalledWith(db, 'system/admins');
      expect(getDoc).toHaveBeenCalledWith(mockAdminsDocRef);
      expect(setDoc).toHaveBeenCalledWith(
        mockAdminsDocRef,
        { userIds: [mockUserId] }
      );
    });

    it('should add test user to existing admin list if not present', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: ['existing-admin-1', 'existing-admin-2'],
        })),
      };

      (doc as jest.Mock).mockReturnValue(mockAdminsDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await ensureTestUserIsAdmin();

      expect(setDoc).toHaveBeenCalledWith(
        mockAdminsDocRef,
        { userIds: ['existing-admin-1', 'existing-admin-2', mockUserId] },
        { merge: true }
      );
    });

    it('should not modify admin list if test user is already an admin', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: ['existing-admin-1', mockUserId],
        })),
      };

      (doc as jest.Mock).mockReturnValue(mockAdminsDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);

      await ensureTestUserIsAdmin();

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should do nothing if not a test user', async () => {
      (auth as { currentUser: { uid: string; isAnonymous: boolean } | null }).currentUser = {
        uid: 'regular-user',
        isAnonymous: false,
      };

      (isLocalTestUserEnabled as jest.Mock).mockReturnValue(false);

      await ensureTestUserIsAdmin();

      expect(getDoc).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('createEvent', () => {
    it('should ensure test user is admin before creating event', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => false),
      };
      const mockEventDocRef = { id: mockEventId };

      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef) // For ensureTestUserIsAdmin
        .mockReturnValueOnce(mockEventDocRef); // For createEvent
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createEvent('Test Event');

      // Verify ensureTestUserIsAdmin was called
      expect(getDoc).toHaveBeenCalledWith(mockAdminsDocRef);
      expect(setDoc).toHaveBeenCalledWith(
        mockAdminsDocRef,
        { userIds: [mockUserId] }
      );

      // Verify event was created (second call to setDoc)
      const setDocCalls = (setDoc as jest.Mock).mock.calls;
      expect(setDocCalls.length).toBeGreaterThanOrEqual(2);
      const eventCreationCall = setDocCalls.find(call => 
        call[0] === mockEventDocRef && 
        call[1]?.name === 'Test Event'
      );
      expect(eventCreationCall).toBeDefined();

      expect(result.name).toBe('Test Event');
      expect(result.status).toBe('voting');
    });

    it('should create event even if admin document already exists and user is admin', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: [mockUserId],
        })),
      };
      const mockEventDocRef = { id: mockEventId };

      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef)
        .mockReturnValueOnce(mockEventDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await createEvent('Another Test Event');

      // Should not try to update admin list since user is already admin
      expect(setDoc).toHaveBeenCalledTimes(1); // Only for event creation
      expect(result.name).toBe('Another Test Event');
    });
  });

  describe('deleteEvent', () => {
    it('should ensure test user is admin before deleting event', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: [mockUserId],
        })),
      };
      const mockEventDocRef = { id: mockEventId };
      const mockVotesCollection = { id: 'votes' };
      const mockCategoriesCollection = { id: 'categories' };

      // These are already imported and mocked at the top of the file
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');
      const { deleteFolder } = await import('./storage');

      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef) // For ensureTestUserIsAdmin
        .mockReturnValueOnce(mockEventDocRef); // For deleteEvent
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (collection as jest.Mock)
        .mockReturnValueOnce(mockVotesCollection)
        .mockReturnValueOnce(mockCategoriesCollection);
      (getDocs as jest.Mock).mockResolvedValue({ 
        docs: [],
        forEach: jest.fn((callback) => [].forEach(callback)),
      });
      (writeBatch as jest.Mock).mockReturnValue({
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteFolder as jest.Mock).mockResolvedValue(undefined);

      await deleteEvent(mockEventId);

      // Verify ensureTestUserIsAdmin was called
      expect(getDoc).toHaveBeenCalledWith(mockAdminsDocRef);

      // Verify event was deleted
      expect(deleteDoc).toHaveBeenCalledWith(mockEventDocRef);
      expect(deleteFolder).toHaveBeenCalledWith(`events/${mockEventId}/cookies`);
    });

    it('should add test user to admin list if not present before deleting', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: ['other-admin'],
        })),
      };
      const mockEventDocRef = { id: mockEventId };

      // These are already imported and mocked at the top of the file
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');
      const { deleteFolder } = await import('./storage');

      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef)
        .mockReturnValueOnce(mockEventDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (collection as jest.Mock).mockReturnValue({});
      const mockSnapshot = {
        docs: [],
        forEach: jest.fn((callback) => [].forEach(callback)),
      };
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      (writeBatch as jest.Mock).mockReturnValue({
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteFolder as jest.Mock).mockResolvedValue(undefined);

      await deleteEvent(mockEventId);

      // Verify test user was added to admin list
      expect(setDoc).toHaveBeenCalledWith(
        mockAdminsDocRef,
        { userIds: ['other-admin', mockUserId] },
        { merge: true }
      );

      // Verify event was deleted
      expect(deleteDoc).toHaveBeenCalledWith(mockEventDocRef);
    });
  });

  describe('Integration: create and delete event', () => {
    it('should allow test user to create and then delete an event', async () => {
      const mockAdminsDocRef = { id: 'admins' };
      const mockAdminsDoc = {
        exists: jest.fn(() => false), // Admin doc doesn't exist initially
      };
      const mockEventDocRef = { id: mockEventId };

      // These are already imported and mocked at the top of the file
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');
      const { deleteFolder } = await import('./storage');

      // Setup mocks for create
      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef)
        .mockReturnValueOnce(mockEventDocRef);
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDoc);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // Create event
      const event = await createEvent('Test Event');
      expect(event.name).toBe('Test Event');

      // Verify admin doc was created (check all calls)
      const setDocCalls = (setDoc as jest.Mock).mock.calls;
      expect(setDocCalls.length).toBeGreaterThanOrEqual(2);
      // Find the admin doc creation call - it should be one of the first two calls
      const adminCall = setDocCalls.find(call => 
        call[0] === mockAdminsDocRef && 
        call[1] && 
        call[1].userIds && 
        Array.isArray(call[1].userIds)
      );
      expect(adminCall).toBeDefined();
      expect(adminCall![1].userIds).toContain(mockUserId);

      // Setup mocks for delete - need to set up new doc calls
      const mockAdminsDocForDelete = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          userIds: [mockUserId],
        })),
      };
      const mockEventDocRefForDelete = { id: event.id };
      
      // Set up mocks for delete operation (ensureTestUserIsAdmin + deleteEvent)
      (doc as jest.Mock)
        .mockReturnValueOnce(mockAdminsDocRef) // For ensureTestUserIsAdmin
        .mockReturnValueOnce(mockEventDocRefForDelete); // For deleteEvent
      (getDoc as jest.Mock).mockResolvedValue(mockAdminsDocForDelete);
      (collection as jest.Mock).mockReturnValue({});
      const mockSnapshot = {
        docs: [],
        forEach: jest.fn((callback) => [].forEach(callback)),
      };
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      (writeBatch as jest.Mock).mockReturnValue({
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteFolder as jest.Mock).mockResolvedValue(undefined);

      // Delete event
      await deleteEvent(event.id);

      // Verify event was deleted
      expect(deleteDoc).toHaveBeenCalledWith(mockEventDocRefForDelete);
      expect(deleteFolder).toHaveBeenCalledWith(`events/${event.id}/cookies`);
    });
  });
});

