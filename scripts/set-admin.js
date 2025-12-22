import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

if (process.argv.length < 3) {
  console.error('Usage: node scripts/set-admin.js <email_or_uid>');
  process.exit(1);
}

const targetUser = process.argv[2];

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account first for explicit project ID
    // This is robust against "Unable to detect a Project Id" errors
    const serviceAccount = require('../service-account.json');
    console.log(`Found service account for project: ${serviceAccount.project_id}`);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('Initialized with service-account.json');
  } catch (e) {
    console.warn('Could not load ../service-account.json, trying default credentials...');
    try {
      admin.initializeApp();
    } catch (e2) {
      console.error('Failed to initialize firebase-admin:', e2.message);
      process.exit(1);
    }
  }
}

async function setAdminRole(userInput) {
  try {
    let user;
    // Check if input looks like an email
    if (userInput.includes('@')) {
      user = await admin.auth().getUserByEmail(userInput);
    } else {
      user = await admin.auth().getUser(userInput);
    }

    if (!user) {
      console.error(`User ${userInput} not found.`);
      process.exit(1);
    }

    console.log(`Setting admin claim for user: ${user.email} (${user.uid})`);

    // Set custom user claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Refresh user to verify (optional, mostly for display)
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log(`Successfully set admin claim.`);
    console.log(`Current claims:`, updatedUser.customClaims);
    console.log(`\nNOTE: The user may need to sign out and sign back in (or refresh the page) for this to take effect.`);

  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole(targetUser);
