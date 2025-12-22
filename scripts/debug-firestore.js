/**
 * Debug script to inspect Firestore database
 * Checks events, categories, bakers, and permissions
 *
 * Usage: node scripts/debug-firestore.js
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK
// Try to use emulator first, then fall back to production
const useEmulator = process.env.USE_EMULATOR !== 'false';

if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
}

// Initialize admin app
if (!admin.apps.length) {
  try {
    // Try to use service account if available
    const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.VITE_PROJECT_ID || 'cookie-voting',
      });
      console.log('✅ Using service account for Firebase Admin');
    } else {
      // Use default credentials (for emulator or if using Application Default Credentials)
      admin.initializeApp({
        projectId: process.env.VITE_PROJECT_ID || 'cookie-voting',
      });
      console.log('✅ Using default credentials for Firebase Admin');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function debugFirestore() {
  console.log('\n🔍 Debugging Firestore Database...\n');
  console.log(`📍 Using: ${useEmulator ? 'Emulator' : 'Production'}\n`);

  try {
    // 1. Check system/admins
    console.log('1️⃣  Checking system/admins...');
    const adminsDoc = await db.collection('system').doc('admins').get();
    if (adminsDoc.exists) {
      const admins = adminsDoc.data();
      console.log('   ✅ Admin document exists');
      console.log('   📋 Admin UIDs:', admins.userIds || []);
    } else {
      console.log('   ⚠️  Admin document does not exist');
    }
    console.log('');

    // 2. List all events
    console.log('2️⃣  Listing all events...');
    const eventsSnapshot = await db.collection('events').get();
    console.log(`   📊 Found ${eventsSnapshot.size} event(s)`);

    if (eventsSnapshot.empty) {
      console.log('   ⚠️  No events found in database');
      return;
    }

    // 3. For each event, check categories and bakers
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;

      console.log(`\n   📅 Event: ${eventData.name || 'Unnamed'} (ID: ${eventId})`);
      console.log(`      Status: ${eventData.status || 'unknown'}`);
      console.log(
        `      Created: ${eventData.createdAt ? new Date(eventData.createdAt).toISOString() : 'unknown'}`,
      );

      // Check categories
      console.log(`\n   🏷️  Categories:`);
      const categoriesSnapshot = await db
        .collection('events')
        .doc(eventId)
        .collection('categories')
        .get();
      console.log(`      Found ${categoriesSnapshot.size} category/categories`);

      if (categoriesSnapshot.empty) {
        console.log('      ⚠️  NO CATEGORIES FOUND - This is the issue!');
      } else {
        categoriesSnapshot.forEach((catDoc) => {
          const catData = catDoc.data();
          console.log(`      - ${catData.name || 'Unnamed'} (ID: ${catDoc.id})`);
          console.log(`        Image: ${catData.imageUrl ? '✅' : '❌ Missing'}`);
          console.log(`        Cookies: ${catData.cookies?.length || 0}`);
          console.log(`        Order: ${catData.order ?? 'not set'}`);
        });
      }

      // Check bakers
      console.log(`\n   👨‍🍳 Bakers:`);
      const bakersSnapshot = await db.collection('events').doc(eventId).collection('bakers').get();
      console.log(`      Found ${bakersSnapshot.size} baker(s)`);

      if (bakersSnapshot.empty) {
        console.log('      ⚠️  No bakers found');
      } else {
        bakersSnapshot.forEach((bakerDoc) => {
          const bakerData = bakerDoc.data();
          console.log(`      - ${bakerData.name || 'Unnamed'} (ID: ${bakerDoc.id})`);
        });
      }

      // Check votes
      console.log(`\n   🗳️  Votes:`);
      const votesSnapshot = await db.collection('events').doc(eventId).collection('votes').get();
      console.log(`      Found ${votesSnapshot.size} vote(s)`);
    }

    // 4. Check test_events if in emulator mode
    if (useEmulator) {
      console.log('\n3️⃣  Checking test_events collection...');
      const testEventsSnapshot = await db.collection('test_events').get();
      console.log(`   📊 Found ${testEventsSnapshot.size} test event(s)`);

      if (!testEventsSnapshot.empty) {
        console.log(
          '   ⚠️  Found events in test_events collection - code might be using wrong collection!',
        );
      }
    }

    console.log('\n✅ Debug complete!\n');
  } catch (error) {
    console.error('\n❌ Error debugging Firestore:', error);
    if (error.code === 'permission-denied') {
      console.error('   ⚠️  Permission denied - make sure you have proper credentials');
    }
    process.exit(1);
  }
}

debugFirestore();
