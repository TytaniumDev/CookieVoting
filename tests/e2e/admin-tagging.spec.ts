import { test, expect } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configure Firebase Admin SDK to use emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

// Initialize Firebase Admin SDK to interact with Firestore Emulator
if (getApps().length === 0) {
  initializeApp({
    projectId: 'cookie-voting',
  });
}

const db = getFirestore();

test.describe.skip('Admin Tagging Flow - Legacy/Fallback', () => {
  const eventId = 'e2e-tagging-test';

  test.beforeAll(async () => {
    // cleanup previous run
    await db.collection('events').doc(eventId).delete();

    // 1. Create an event
    await db.collection('events').doc(eventId).set({
      name: 'Tagging Test Event',
      status: 'voting',
      adminCode: '1234',
      createdAt: Date.now(),
    });
    // Add bakers
    await db.collection('events').doc(eventId).collection('bakers').doc('baker1').set({
      id: 'baker1',
      name: 'Baker 1',
    });

    // 2. Create a category with a direct URL (no ImageEntity in 'images' collection)
    // This simulates the "Legacy" state or incomplete data import
    const imageUrl = 'http://localhost:5000/test-image.jpg';
    await db.collection('events').doc(eventId).collection('categories').doc('cat1').set({
      name: 'Test Category',
      imageUrl: imageUrl, // Direct URL
      cookies: [],
      order: 1,
    });

    // 3. Create Detection Data in `image_detections`
    // The ID must match the logic in extractFilePathFromUrl -> ID generation
    // But since we use localhost URL, extractFilePath might return null or handle it weirdly.
    // Actually, internal logic:
    // filePath = extractFilePathFromUrl(imageUrl)
    // detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');

    // HOWEVER, CookieTaggingStep ALSO calls getImageDetectionResults(currentCategory.imageUrl)
    // which calls extractFilePathFromUrl.
    // If that returns null, manualDetections will be empty.

    // Let's create a simpler test: Assume the URL is "valid enough" to extract a path
    // OR rely on the fact that we can just stub `watchImageDetectionResults`?
    // No, this is E2E.

    // Let's use a URL that trips the "storage.googleapis.com" regex but is fake?
    // Or just `firebasestorage.googleapis.com` format.
    const fakeStorageUrl =
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/test_image.jpg?alt=media';

    // Update category with this URL
    await db.collection('events').doc(eventId).collection('categories').doc('cat1').update({
      imageUrl: fakeStorageUrl,
    });

    // Create the detection document.
    // filePath should be "test_image.jpg"
    // docId should be "test_image_jpg"
    const detectionDocId = 'test_image_jpg';
    await db
      .collection('image_detections')
      .doc(detectionDocId)
      .set({
        imageUrl: fakeStorageUrl,
        detectedCookies: [{ x: 50, y: 50, width: 10, height: 10, confidence: 0.9, polygon: [] }],
      });
  });

  // Clean up
  test.afterAll(async () => {
    // await db.collection('events').doc(eventId).delete();
  });

  test('should allow assigning a baker even without ImageEntity', async ({ page }) => {
    // 1. Go to the Tagging Wizard Page directly
    await page.goto(`/admin/${eventId}/wizard?categoryId=cat1`);

    // 2. Wait for the fallback cookie detection to appear
    // Use the aria-label constructed in CookieViewer: "Cookie 1: 90.0% confidence"
    const cookieButton = page.getByRole('button', { name: /Cookie 1/ });
    await expect(cookieButton).toBeVisible({ timeout: 10000 });

    // 3. Click the cookie to open assignment menu
    await cookieButton.click();

    // 4. Verify "Assign Baker" menu appears
    await expect(page.getByText('Assign Baker')).toBeVisible();

    // 5. Select a baker ("Baker 1" was seeded)
    await page.getByRole('button', { name: 'Baker 1' }).click();

    // 6. Verify assignment success visually
    // The menu should close or update
    await expect(page.getByText('Assign Baker')).not.toBeVisible();

    // The cookie should now show the baker's name below it.
    // The component uses `bakerLabel` class (hashed) but contains the text "Baker 1"
    // It resides in the absolute div below the cookie.

    // We can just verify "Baker 1" is visible on the page (aside from the button we just clicked, which is gone)
    // Actually the button options are gone, so "Baker 1" text should be the label.
    // Let's be specific: look for a div with text "Baker 1" that is NOT a button.
    await expect(page.locator('div').filter({ hasText: /^Baker 1$/ })).toBeVisible();
  });
});
