/**
 * Import script for manually exported Firebase Emulator data
 * This script imports data exported by export-emulator-data.js
 *
 * Usage: npm run emulators:import:manual
 * (Make sure emulators are running first)
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
const emulatorDataDir = join(process.cwd(), 'emulator-data');

// Wait for emulators to be ready
async function waitForEmulators(maxRetries = 10, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
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

async function importData() {
  console.log('📥 Importing Firebase Emulator data...\n');

  try {
    // Check if export directory exists
    if (!existsSync(emulatorDataDir)) {
      throw new Error(
        `Export directory does not exist: ${emulatorDataDir}\nRun 'npm run emulators:export:manual' first to export data.`,
      );
    }

    // Wait for emulators
    await waitForEmulators();

    // Import Authentication users
    const authExportPath = join(emulatorDataDir, 'auth_export', 'accounts.json');
    if (existsSync(authExportPath)) {
      console.log('📋 Importing Authentication users...');
      const authData = JSON.parse(readFileSync(authExportPath, 'utf8'));

      for (const userData of authData.users || []) {
        try {
          // Check if user already exists
          try {
            await auth.getUser(userData.uid);
            // Check if user has email/password and might need password reset
            const hasEmailPassword =
              userData.providerData?.some((provider) => provider.providerId === 'password') ||
              (userData.email && !userData.providerData?.length);

            if (hasEmailPassword && userData.email) {
              // Update password to default for emulator
              await auth.updateUser(userData.uid, {
                password: 'test123456',
              });
              console.log(
                `  🔄 Updated password for existing user: ${userData.email} (password: test123456)`,
              );
            } else {
              console.log(
                `  ⏭️  User ${userData.email || userData.uid} already exists, skipping...`,
              );
            }
          } catch (error) {
            if (error.code === 'auth/user-not-found') {
              // Check if user has email/password provider
              const hasEmailPassword =
                userData.providerData?.some((provider) => provider.providerId === 'password') ||
                (userData.email && !userData.providerData?.length);

              // Create user
              const createUserOptions = {
                uid: userData.uid,
                email: userData.email,
                emailVerified: userData.emailVerified,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                disabled: userData.disabled,
              };

              // If user has email/password, set a default password for emulator
              if (hasEmailPassword && userData.email) {
                createUserOptions.password = 'test123456'; // Default password for emulator users
              }

              await auth.createUser(createUserOptions);

              if (hasEmailPassword && userData.email) {
                console.log(`  ✅ Created user: ${userData.email} (password: test123456)`);
              } else {
                console.log(`  ✅ Created user: ${userData.email || userData.uid}`);
              }
            } else {
              throw error;
            }
          }
        } catch (error) {
          console.error(
            `  ❌ Error importing user ${userData.email || userData.uid}:`,
            error.message,
          );
        }
      }
      console.log(`✅ Imported ${authData.users?.length || 0} authentication user(s)\n`);
    } else {
      console.log('ℹ️  No authentication data to import\n');
    }

    // Import Firestore data
    const firestoreExportPath = join(emulatorDataDir, 'firestore_export', 'data.json');
    if (existsSync(firestoreExportPath)) {
      console.log('📋 Importing Firestore data...');
      const firestoreData = JSON.parse(readFileSync(firestoreExportPath, 'utf8'));

      async function importDocument(path, data, parentRef = null) {
        const parts = path.split('/');
        const collectionName = parts[0];
        const docId = parts[1];

        if (!docId) {
          // This is a collection, import all documents
          if (typeof data === 'object' && data !== null) {
            for (const [key, value] of Object.entries(data)) {
              await importDocument(key, value, parentRef);
            }
          }
          return;
        }

        // Extract subcollections
        const subcollections = {};
        const docData = {};

        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('__subcollections__')) {
            const subcolName = key.replace('__subcollections__', '');
            subcollections[subcolName] = value;
          } else {
            docData[key] = value;
          }
        }

        // Get the document reference
        let docRef;
        if (parentRef) {
          docRef = parentRef.collection(collectionName).doc(docId);
        } else {
          docRef = db.collection(collectionName).doc(docId);
        }

        // Set document data
        if (Object.keys(docData).length > 0) {
          await docRef.set(docData);
          console.log(`  ✅ Imported document: ${collectionName}/${docId}`);
        }

        // Import subcollections
        for (const [subcolName, subcolData] of Object.entries(subcollections)) {
          if (typeof subcolData === 'object' && subcolData !== null) {
            for (const [subDocPath, subDocData] of Object.entries(subcolData)) {
              const subDocId = subDocPath.split('/').pop();
              await importDocument(`${subcolName}/${subDocId}`, subDocData, docRef);
            }
          }
        }
      }

      // Import all collections
      for (const [collectionName, collectionData] of Object.entries(firestoreData)) {
        if (typeof collectionData === 'object' && collectionData !== null) {
          for (const [docPath, docData] of Object.entries(collectionData)) {
            const fullPath = `${collectionName}/${docPath}`;
            await importDocument(fullPath, docData);
          }
        }
      }

      console.log(`✅ Imported Firestore data\n`);
    } else {
      console.log('ℹ️  No Firestore data to import\n');
    }

    console.log('✅ Import completed successfully!');
    console.log('\n💡 You can now use the imported data in your app.');
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

importData();
