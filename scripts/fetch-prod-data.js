/**
 * Fetch Production Data Script
 *
 * Fetches Firestore data from the PRODUCTION project and saves it to
 * ./emulator-data/firestore_export/data.json in the format expected
 * by scripts/import-emulator-data.js.
 *
 * PREREQUISITES:
 * 1. You must have access to the production Firebase project.
 * 2. Run: gcloud auth application-default login
 */

import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Current working directory
const cwd = process.cwd();
const emulatorDataDir = join(cwd, 'emulator-data');
const firestoreExportDir = join(emulatorDataDir, 'firestore_export');

// Initialize Firebase Admin with Application Default Credentials (ADC)
// OR use service-account.json if found locally
if (!admin.apps.length) {
  const serviceAccountPath = join(cwd, 'service-account.json');
  let credential;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  } else if (existsSync(serviceAccountPath)) {
    console.log('🔑 Found service-account.json, using for authentication...');
    credential = admin.credential.cert(serviceAccountPath);
  } else {
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    projectId: 'cookie-voting',
    credential: credential,
  });
}

const db = admin.firestore();

async function fetchProdData() {
  console.log('🌍 Connecting to PRODUCTION Firestore...');
  console.log('   (Ensure you have run "gcloud auth application-default login")');

  try {
    // Ensure export directory exists
    if (!existsSync(firestoreExportDir)) {
      mkdirSync(firestoreExportDir, { recursive: true });
    }

    const firestoreExport = {};

    // Helper to recursively fetch collections
    async function fetchCollection(collectionRef, path = '') {
      const snapshot = await collectionRef.get();
      if (snapshot.empty) {
        return {};
      }

      const data = {};
      for (const doc of snapshot.docs) {
        const docPath = path ? `${path}/${doc.id}` : doc.id;
        const docData = doc.data();

        console.log(`   📄 Fetched: ${docPath}`);

        // Check for subcollections
        const subcollections = await doc.ref.listCollections();
        if (subcollections.length > 0) {
          for (const subcol of subcollections) {
            console.log(`   📂 Fetching subcollection: ${subcol.id} for ${docPath}`);
            const subcolData = await fetchCollection(subcol, `${docPath}/${subcol.id}`);
            if (Object.keys(subcolData).length > 0) {
              docData[`__subcollections__${subcol.id}`] = subcolData;
            }
          }
        }

        data[docPath] = docData;
      }
      return data;
    }

    // Fetch all top-level collections
    const collections = await db.listCollections();
    console.log(`\nfound ${collections.length} top-level collections.`);

    for (const collection of collections) {
      console.log(`\n📦 Fetching collection: ${collection.id}...`);
      const collectionData = await fetchCollection(collection);
      if (Object.keys(collectionData).length > 0) {
        firestoreExport[collection.id] = collectionData;
      }
    }

    // Save to file
    const outputPath = join(firestoreExportDir, 'data.json');
    writeFileSync(outputPath, JSON.stringify(firestoreExport, null, 2));

    console.log(`\n✅ Production data fetched successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ Error fetching production data:', error);
    console.error('Hint: Make sure you have permission to access the production project.');
    console.error('Run: gcloud auth application-default login');
    process.exit(1);
  }
}

fetchProdData().then(() => {
  process.exit(0);
});
