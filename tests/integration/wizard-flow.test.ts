/**
 * Comprehensive integration test for the full wizard flow
 * Tests: image upload → category naming → baker addition → cookie tagging
 * Verifies data appears correctly on admin and voting pages
 */

// Mock firebase.ts module BEFORE importing firestore functions
jest.mock('../../src/lib/firebase', async () => {
  const firebaseTestInit = await import('./firebase-test-init');
  return {
    auth: firebaseTestInit.testAuth,
    db: firebaseTestInit.testDb,
    storage: firebaseTestInit.testStorage,
  };
});

import { testAuth, testDb } from './setup';
import { 
  createEvent, 
  getEvent,
  getAllEvents,
  addCategory,
  getCategories,
  addBaker,
  getBakers,
  updateCategoryCookies,
} from '../../src/lib/firestore';
import { uploadImage } from '../../src/lib/storage';
import { 
  setupTestUser, 
  cleanupTestEvents, 
  trackEventId, 
  waitForFirestore
} from './setup';
import { doc, getDoc } from 'firebase/firestore';
import { type Category, type CookieCoordinate } from '../../src/lib/types';

describe('Wizard Flow Integration Test', () => {
  let testUserId: string;
  let eventId: string;
  const testEventName = 'Test Wizard Event';

  // Test data
  const categoryNames = ['Sugar Cookies', 'Chocolate Chip', 'Gingerbread'];
  const bakerNames = ['Alice', 'Bob', 'Charlie', 'Diana'];
  const cookiesPerBaker = 2; // Tag 2 cookies per baker per category

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

  /**
   * Create a mock image file for testing
   */
  function createMockImageFile(name: string): File {
    // Create a minimal valid PNG file (1x1 pixel transparent PNG)
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
      0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    const blob = new Blob([pngData], { type: 'image/png' });
    return new File([blob], name, { type: 'image/png' });
  }

  describe('Full Wizard Flow', () => {
    it('should complete the entire wizard flow: create event → upload images → name categories → add bakers → tag cookies', async () => {
      // Step 1: Create Event
      console.log('Step 1: Creating event...');
      const event = await createEvent(testEventName);
      eventId = event.id;
      trackEventId(eventId);
      await waitForFirestore();
      
      expect(event).toBeDefined();
      expect(event.name).toBe(testEventName);
      expect(event.status).toBe('voting');
      console.log(`✅ Event created: ${eventId}`);

      // Step 2: Upload 3 Images
      console.log('Step 2: Uploading 3 images...');
      const imageFiles = categoryNames.map((name, index) => 
        createMockImageFile(`${name.toLowerCase().replace(/\s+/g, '-')}-${index}.png`)
      );
      
      const collectionPrefix = 'test_';
      const storagePath = `${collectionPrefix}events/${eventId}/cookies`;
      const uploadedImageUrls: string[] = [];
      
      for (const imageFile of imageFiles) {
        const imageUrl = await uploadImage(imageFile, storagePath);
        uploadedImageUrls.push(imageUrl);
        expect(imageUrl).toBeTruthy();
        expect(imageUrl).toContain('http'); // Should be a valid URL
      }
      
      expect(uploadedImageUrls).toHaveLength(3);
      console.log(`✅ Uploaded ${uploadedImageUrls.length} images`);

      // Step 3: Create Categories with Names
      console.log('Step 3: Creating categories...');
      const categories: Category[] = [];
      
      for (let i = 0; i < categoryNames.length; i++) {
        const category = await addCategory(eventId, categoryNames[i], uploadedImageUrls[i]);
        categories.push(category);
        expect(category.name).toBe(categoryNames[i]);
        expect(category.imageUrl).toBe(uploadedImageUrls[i]);
        expect(category.cookies).toEqual([]); // Initially empty
      }
      
      await waitForFirestore();
      expect(categories).toHaveLength(3);
      console.log(`✅ Created ${categories.length} categories`);

      // Verify categories are saved in Firestore
      const savedCategories = await getCategories(eventId);
      expect(savedCategories).toHaveLength(3);
      savedCategories.forEach((cat, index) => {
        expect(cat.name).toBe(categoryNames[index]);
        expect(cat.imageUrl).toBe(uploadedImageUrls[index]);
      });

      // Step 4: Add 4 Bakers
      console.log('Step 4: Adding bakers...');
      const bakers = [];
      
      for (const bakerName of bakerNames) {
        const baker = await addBaker(eventId, bakerName);
        bakers.push(baker);
        expect(baker.name).toBe(bakerName);
        expect(baker.id).toBeTruthy();
      }
      
      await waitForFirestore();
      expect(bakers).toHaveLength(4);
      console.log(`✅ Added ${bakers.length} bakers`);

      // Verify bakers are saved in Firestore
      const savedBakers = await getBakers(eventId);
      expect(savedBakers).toHaveLength(4);
      savedBakers.forEach((baker, index) => {
        expect(baker.name).toBe(bakerNames[index]);
      });

      // Step 5: Tag Cookies
      console.log('Step 5: Tagging cookies...');
      // Tag 2 cookies per baker per category
      // Use different coordinates for each cookie
      let cookieNumber = 1;
      
      for (const category of categories) {
        const categoryCookies: CookieCoordinate[] = [];
        
        for (const baker of bakers) {
          // Tag 2 cookies for this baker in this category
          for (let i = 0; i < cookiesPerBaker; i++) {
            const cookie: CookieCoordinate = {
              id: `cookie-${category.id}-${baker.id}-${i}`,
              number: cookieNumber++,
              makerName: baker.name,
              x: 20 + (i * 30) + (bakers.indexOf(baker) * 10), // Spread them out
              y: 30 + (bakers.indexOf(baker) * 20), // Different rows per baker
            };
            categoryCookies.push(cookie);
          }
        }
        
        // Sort cookies: top to bottom (by y), then left to right (by x)
        categoryCookies.sort((a, b) => {
          const yDiff = a.y - b.y;
          if (Math.abs(yDiff) < 15) {
            return a.x - b.x; // Same row, sort by x
          }
          return yDiff; // Different rows, sort by y
        });
        
        // Re-number cookies after sorting
        categoryCookies.forEach((cookie, index) => {
          cookie.number = index + 1;
        });
        
        // Save cookies for this category
        await updateCategoryCookies(eventId, category.id, categoryCookies);
        await waitForFirestore();
      }
      
      console.log(`✅ Tagged cookies for all categories`);

      // Verify cookies are saved
      const finalCategories = await getCategories(eventId);
      expect(finalCategories).toHaveLength(3);
      
      finalCategories.forEach((category) => {
        expect(category.cookies.length).toBeGreaterThan(0);
        // Should have cookies from all 4 bakers
        const uniqueBakers = new Set(category.cookies.map(c => c.makerName));
        expect(uniqueBakers.size).toBe(4);
        // Should have 2 cookies per baker (8 total per category)
        expect(category.cookies.length).toBe(4 * cookiesPerBaker);
        
        // Verify cookies are numbered correctly
        const sortedCookies = [...category.cookies].sort((a, b) => a.number - b.number);
        sortedCookies.forEach((cookie, index) => {
          expect(cookie.number).toBe(index + 1);
        });
      });

      console.log('✅ All wizard steps completed successfully!');
    });

    it('should verify event data appears on AdminHome page', async () => {
      // Get all events
      const allEvents = await getAllEvents();
      
      // Find our test event
      const testEvent = allEvents.find(e => e.id === eventId);
      expect(testEvent).toBeDefined();
      expect(testEvent?.name).toBe(testEventName);
      
      // Get categories for the event (AdminHome fetches these to show images)
      const categories = await getCategories(eventId);
      expect(categories.length).toBe(3);
      
      // Verify each category has an image URL
      categories.forEach(category => {
        expect(category.imageUrl).toBeTruthy();
        expect(category.imageUrl).toContain('http');
      });
      
      console.log('✅ Event data verified on AdminHome');
    });

    it('should verify event data appears on AdminDashboard page', async () => {
      // Get event details
      const event = await getEvent(eventId);
      expect(event).toBeDefined();
      expect(event?.name).toBe(testEventName);
      expect(event?.status).toBe('voting');
      
      // Get categories
      const categories = await getCategories(eventId);
      expect(categories.length).toBe(3);
      
      // Verify each category has correct data
      categories.forEach((category, index) => {
        expect(category.name).toBe(categoryNames[index]);
        expect(category.imageUrl).toBeTruthy();
        expect(category.cookies.length).toBe(4 * cookiesPerBaker); // 4 bakers × 2 cookies
      });
      
      // Get bakers
      const bakers = await getBakers(eventId);
      expect(bakers.length).toBe(4);
      bakers.forEach((baker, index) => {
        expect(baker.name).toBe(bakerNames[index]);
      });
      
      console.log('✅ Event data verified on AdminDashboard');
    });

    it('should verify event data appears on VotingPage', async () => {
      // Get event
      const event = await getEvent(eventId);
      expect(event).toBeDefined();
      expect(event?.status).toBe('voting'); // Should be votable
      
      // Get categories (VotingPage displays these)
      const categories = await getCategories(eventId);
      expect(categories.length).toBe(3);
      
      // Verify categories are suitable for voting
      categories.forEach((category) => {
        expect(category.name).toBeTruthy();
        expect(category.imageUrl).toBeTruthy();
        expect(category.cookies.length).toBeGreaterThan(0);
        
        // Verify cookies have numbers (for voting)
        category.cookies.forEach(cookie => {
          expect(cookie.number).toBeGreaterThan(0);
          expect(cookie.x).toBeGreaterThanOrEqual(0);
          expect(cookie.y).toBeGreaterThanOrEqual(0);
          // Maker names should be present (they get stripped in UI, but data should have them)
          expect(cookie.makerName).toBeTruthy();
        });
        
        // Verify all bakers are represented in cookies
        const cookieMakers = new Set(category.cookies.map(c => c.makerName));
        expect(cookieMakers.size).toBe(4);
        bakerNames.forEach(bakerName => {
          expect(cookieMakers.has(bakerName)).toBe(true);
        });
      });
      
      console.log('✅ Event data verified on VotingPage');
    });

    it('should verify cookie tagging data structure is correct', async () => {
      const categories = await getCategories(eventId);
      
      categories.forEach((category) => {
        // Verify cookies are sorted and numbered correctly
        const sortedCookies = [...category.cookies].sort((a, b) => {
          const yDiff = a.y - b.y;
          if (Math.abs(yDiff) < 15) {
            return a.x - b.x;
          }
          return yDiff;
        });
        
        // Numbers should be sequential starting from 1
        sortedCookies.forEach((cookie, index) => {
          expect(cookie.number).toBe(index + 1);
        });
        
        // Verify each baker has the expected number of cookies
        bakerNames.forEach(bakerName => {
          const bakerCookies = category.cookies.filter(c => c.makerName === bakerName);
          expect(bakerCookies.length).toBe(cookiesPerBaker);
        });
        
        // Verify coordinates are valid percentages
        category.cookies.forEach(cookie => {
          expect(cookie.x).toBeGreaterThanOrEqual(0);
          expect(cookie.x).toBeLessThanOrEqual(100);
          expect(cookie.y).toBeGreaterThanOrEqual(0);
          expect(cookie.y).toBeLessThanOrEqual(100);
        });
      });
      
      console.log('✅ Cookie tagging data structure verified');
    });

    it('should verify Firestore document structure', async () => {
      // Verify event document
      const eventDocRef = doc(testDb, 'test_events', eventId);
      const eventDoc = await getDoc(eventDocRef);
      expect(eventDoc.exists()).toBe(true);
      const eventData = eventDoc.data();
      expect(eventData?.name).toBe(testEventName);
      expect(eventData?.status).toBe('voting');
      
      // Verify categories subcollection
      const categories = await getCategories(eventId);
      expect(categories.length).toBe(3);
      
      for (const category of categories) {
        const categoryDocRef = doc(testDb, 'test_events', eventId, 'categories', category.id);
        const categoryDoc = await getDoc(categoryDocRef);
        expect(categoryDoc.exists()).toBe(true);
        const categoryData = categoryDoc.data();
        expect(categoryData?.name).toBe(category.name);
        expect(categoryData?.imageUrl).toBe(category.imageUrl);
        expect(Array.isArray(categoryData?.cookies)).toBe(true);
        expect(categoryData?.cookies.length).toBe(4 * cookiesPerBaker);
      }
      
      // Verify bakers subcollection
      const bakers = await getBakers(eventId);
      expect(bakers.length).toBe(4);
      
      for (const baker of bakers) {
        const bakerDocRef = doc(testDb, 'test_events', eventId, 'bakers', baker.id);
        const bakerDoc = await getDoc(bakerDocRef);
        expect(bakerDoc.exists()).toBe(true);
        const bakerData = bakerDoc.data();
        expect(bakerData?.name).toBe(baker.name);
      }
      
      console.log('✅ Firestore document structure verified');
    });
  });
});

