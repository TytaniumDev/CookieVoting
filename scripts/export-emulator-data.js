/**
 * Manual export script for Firebase Emulator data
 * This script exports data from running emulators using Firebase Admin SDK
 * Use this as a workaround when the built-in export command fails
 * 
 * Usage: npm run emulators:export:manual
 * (Make sure emulators are running first)
 */

import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
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
        } catch (error) {
            if (i < maxRetries - 1) {
                console.log(`⏳ Waiting for emulators to start... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error('Emulators did not start in time. Make sure emulators are running: npm run emulators:start');
            }
        }
    }
}

async function exportData() {
    console.log('📦 Exporting Firebase Emulator data...\n');

    try {
        // Wait for emulators
        await waitForEmulators();

        // Create export directory
        if (!existsSync(emulatorDataDir)) {
            mkdirSync(emulatorDataDir, { recursive: true });
        }

        // Export Authentication users
        console.log('📋 Exporting Authentication users...');
        const authExport = {
            users: []
        };
        
        let nextPageToken;
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            authExport.users.push(...listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                photoURL: user.photoURL,
                disabled: user.disabled,
                metadata: {
                    creationTime: user.metadata.creationTime,
                    lastSignInTime: user.metadata.lastSignInTime,
                },
                providerData: user.providerData.map(provider => ({
                    uid: provider.uid,
                    email: provider.email,
                    displayName: provider.displayName,
                    photoURL: provider.photoURL,
                    providerId: provider.providerId,
                })),
            })));
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        const authDir = join(emulatorDataDir, 'auth_export');
        if (!existsSync(authDir)) {
            mkdirSync(authDir, { recursive: true });
        }
        writeFileSync(
            join(authDir, 'accounts.json'),
            JSON.stringify(authExport, null, 2)
        );
        console.log(`✅ Exported ${authExport.users.length} authentication user(s)`);

        // Export Firestore data
        console.log('📋 Exporting Firestore data...');
        const firestoreExport = {};
        
        async function exportCollection(collectionRef, path = '') {
            const snapshot = await collectionRef.get();
            if (snapshot.empty) {
                return {};
            }

            const data = {};
            for (const doc of snapshot.docs) {
                const docPath = path ? `${path}/${doc.id}` : doc.id;
                const docData = doc.data();
                
                // Check for subcollections
                const subcollections = await doc.ref.listCollections();
                if (subcollections.length > 0) {
                    for (const subcol of subcollections) {
                        const subcolData = await exportCollection(subcol, `${docPath}/${subcol.id}`);
                        if (Object.keys(subcolData).length > 0) {
                            docData[`__subcollections__${subcol.id}`] = subcolData;
                        }
                    }
                }
                
                data[docPath] = docData;
            }
            return data;
        }

        // Export all top-level collections
        const collections = await db.listCollections();
        for (const collection of collections) {
            const collectionData = await exportCollection(collection);
            if (Object.keys(collectionData).length > 0) {
                firestoreExport[collection.id] = collectionData;
            }
        }

        const firestoreDir = join(emulatorDataDir, 'firestore_export');
        if (!existsSync(firestoreDir)) {
            mkdirSync(firestoreDir, { recursive: true });
        }
        writeFileSync(
            join(firestoreDir, 'data.json'),
            JSON.stringify(firestoreExport, null, 2)
        );
        console.log(`✅ Exported Firestore data from ${collections.length} collection(s)`);

        // Note: Storage export is more complex and would require additional setup
        console.log('⚠️  Storage export not implemented in this script');
        console.log('   Storage files are typically small and can be re-uploaded if needed');

        console.log('\n✅ Export completed successfully!');
        console.log(`📁 Data saved to: ${emulatorDataDir}`);
        console.log('\n💡 To import this data, use: npm run emulators:start:seed');

    } catch (error) {
        console.error('\n❌ Export failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

exportData();

