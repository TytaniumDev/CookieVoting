
import { test, expect } from '@playwright/test';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK to interact with Firestore Emulator
if (getApps().length === 0) {
    initializeApp({
        projectId: 'cookie-voting',
    });
}

const db = getFirestore();

test.describe('Voting Flow - Closed Event', () => {
    const eventId = 'e2e-closed-voting-test';

    test.beforeAll(async () => {
        // cleanup previous run
        await db.collection('events').doc(eventId).delete();

        // 1. Create an event in 'voting' status first
        await db.collection('events').doc(eventId).set({
            name: 'Closed Voting Test Event',
            status: 'voting',
            adminCode: '1234',
            createdAt: Date.now(),
            resultsAvailableTime: Date.now() + 100000
        });

        // Add a category so the landing page isn't empty
        await db.collection('events').doc(eventId).collection('categories').doc('cat1').set({
            name: 'Test Category',
            imageUrl: 'http://placeholder.com/cookie.png',
            cookies: [
                { id: 'c1', number: 1, x: 10, y: 10, makerName: 'Baker 1' },
                { id: 'c2', number: 2, x: 20, y: 20, makerName: 'Baker 2' }
            ]
        });
    });

    // Clean up
    test.afterAll(async () => {
        // await db.collection('events').doc(eventId).delete();
    });

    test('should redirect to waiting page when anonymous user tries to vote on closed event', async ({ page }) => {
        // 2. Simulate Admin closing the voting
        // We do this via DB update to effectively test the "Close Voting" outcome
        await db.collection('events').doc(eventId).update({
            status: 'completed'
        });

        // 3. Anonymous user goes to vote
        await page.goto(`/vote/${eventId}`);

        // 4. Should see Landing Page
        await expect(page.getByRole('heading', { name: 'Closed Voting Test Event' })).toBeVisible();

        // 5. Click "Start Voting"
        const startButton = page.getByRole('button', { name: 'Start Voting' });
        await expect(startButton).toBeVisible();
        await startButton.click();

        // 6. Should go directly to Waiting Page (NOT Voting)
        // Check for text characteristic of Waiting View
        // "Thank You For Voting!" is the title
        await expect(page.getByRole('heading', { name: 'Thank You For Voting!' })).toBeVisible();
        await expect(page.getByText('Test Category')).not.toBeVisible(); // Should NOT see category voting
    });
});
