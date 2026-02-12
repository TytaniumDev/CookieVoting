/**
 * Seed Firebase Emulator with default data
 * This script creates initial data for development:
 * - Test admin user (test@local.dev)
 * - Admin document in Firestore
 * - Optional: Sample event
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

// Initialize admin app (use default credentials for emulator)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_PROJECT_ID || 'cookie-voting',
  });
}

const auth = admin.auth();
const db = admin.firestore();

const TEST_USER_EMAIL = 'test@local.dev';
const TEST_USER_PASSWORD = 'test123456';
const TEST_USER_UID = 'test-user-default';

// Wait for emulators to be ready
async function waitForEmulators(maxRetries = 10, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try to list users - if this works, emulators are ready
      await auth.listUsers(1);
      console.log('✅ Emulators are ready!\n');
      return;
    } catch {
      if (i < maxRetries - 1) {
        console.log(`⏳ Waiting for emulators to start... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(
          'Emulators did not start in time. Make sure emulators are running: npm run emulators:start',
        );
      }
    }
  }
}

async function seedData() {
  console.log('🌱 Seeding Firebase Emulator with default data...\n');

  // Wait for emulators to be ready
  await waitForEmulators();

  try {
    // 1. Create test admin user
    console.log('1. Creating test admin user...');
    try {
      // Try to get existing user
      await auth.getUser(TEST_USER_UID);
      console.log('   ✅ Test user already exists');
    } catch {
      // User doesn't exist, create it
      await auth.createUser({
        uid: TEST_USER_UID,
        email: TEST_USER_EMAIL,
        emailVerified: true,
        password: TEST_USER_PASSWORD,
        displayName: 'Test Admin User',
      });
      console.log(`   ✅ Created test user: ${TEST_USER_EMAIL}`);
      console.log(`   📋 UID: ${TEST_USER_UID}`);
    }

    // 2. Create admin document in Firestore
    console.log('\n2. Setting up admin document...');
    const adminsRef = db.collection('system').doc('admins');
    const adminsDoc = await adminsRef.get();

    if (adminsDoc.exists) {
      const existingAdmins = adminsDoc.data()?.userIds || [];
      if (!existingAdmins.includes(TEST_USER_UID)) {
        await adminsRef.update({
          userIds: [...existingAdmins, TEST_USER_UID],
        });
        console.log('   ✅ Added test user to existing admin list');
      } else {
        console.log('   ✅ Test user already in admin list');
      }
    } else {
      await adminsRef.set({
        userIds: [TEST_USER_UID],
      });
      console.log('   ✅ Created admin document with test user');
    }

    // 3. Optional: Create a sample event
    const createSampleEvent = process.env.CREATE_SAMPLE_EVENT !== 'false';
    if (createSampleEvent) {
      console.log('\n3. Creating sample event...');
      const { v4: uuidv4 } = await import('uuid');
      const eventId = uuidv4();
      const adminCode = uuidv4().split('-')[0];

      const eventData = {
        id: eventId,
        name: 'Sample Cookie Contest',
        adminCode: adminCode,
        status: 'voting',
        createdAt: Date.now(),
      };

      await db.collection('events').doc(eventId).set(eventData);
      console.log(`   ✅ Created sample event: "${eventData.name}"`);
      console.log(`   📋 Event ID: ${eventId}`);
      console.log(`   🔑 Admin Code: ${adminCode}`);

      // Add sample category and cookies
      console.log('\n4. Creating sample category and cookies...');
      const categoryId = uuidv4();
      const cookie1Id = uuidv4();
      const cookie2Id = uuidv4();
      const cookie3Id = uuidv4();
      const bakerId1 = uuidv4();
      const bakerId2 = uuidv4();

      // Create Bakers
      await db.collection('events').doc(eventId).collection('bakers').doc(bakerId1).set({
        name: 'Ryan',
        id: bakerId1,
      });
      await db.collection('events').doc(eventId).collection('bakers').doc(bakerId2).set({
        name: 'Kelly',
        id: bakerId2,
      });

      const sampleCookies = [
        {
          id: cookie1Id,
          imageUrl: 'https://placehold.co/400x400/orange/white?text=Cookie+1',
        },
        {
          id: cookie2Id,
          imageUrl: 'https://placehold.co/400x400/purple/white?text=Cookie+2',
        },
        {
          id: cookie3Id,
          imageUrl: 'https://placehold.co/400x400/green/white?text=Cookie+3',
        },
      ];

      await db.collection('events').doc(eventId).collection('categories').doc(categoryId).set({
        name: 'Sugar Cookies',
        imageUrl: 'https://placehold.co/600x400/blue/white?text=Sugar+Cookies',
        cookies: sampleCookies,
        order: 0,
      });

      console.log('   ✅ Created sample category: "Sugar Cookies" with 3 cookies');
      console.log('   ✅ Created sample bakers: Ryan, Kelly');
    }

    console.log('\n✅ Seeding complete!');
    console.log('\n📝 Test User Credentials:');
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
    console.log(`   UID: ${TEST_USER_UID}`);
    console.log('\n💡 You can now sign in with these credentials in the app!');
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seed
seedData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
