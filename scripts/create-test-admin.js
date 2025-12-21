#!/usr/bin/env node

/**
 * Script to create test_system/admins document with a specific UID
 * Usage: node scripts/create-test-admin.js <uid>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_API_KEY,
    authDomain: process.env.VITE_AUTH_DOMAIN,
    projectId: process.env.VITE_PROJECT_ID,
    storageBucket: process.env.VITE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
    const uid = process.argv[2];
    
    if (!uid) {
        console.error('Usage: node scripts/create-test-admin.js <uid>');
        console.error('Example: node scripts/create-test-admin.js azohLgSCNWbtfyTAcRUl1j7s2fs1');
        process.exit(1);
    }
    
    try {
        // Sign in as anonymous user
        console.log('Signing in as anonymous user...');
        await signInAnonymously(auth);
        console.log(`✅ Signed in as: ${auth.currentUser.uid}\n`);
        
        // Create test admin document
        console.log(`Creating test_system/admins with UID: ${uid}...`);
        const adminsDocRef = doc(db, 'test_system/admins');
        await setDoc(adminsDocRef, { userIds: [uid] });
        console.log('✅ Test admin document created successfully!\n');
        
        // Sign out
        await signOut(auth);
        console.log('✅ Signed out');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (auth.currentUser) {
            await signOut(auth);
        }
        process.exit(1);
    }
}

main();




