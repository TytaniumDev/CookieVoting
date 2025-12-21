#!/usr/bin/env node

/**
 * Firebase Setup Script
 * 
 * This script helps set up Firebase CLI for non-interactive use.
 * It reads the project ID from your .env file and configures Firebase.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Try to read .env file
function getProjectId() {
  try {
    const envPath = join(projectRoot, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_PROJECT_ID=(.+)/);
    if (match) {
      // Remove quotes if present and trim whitespace
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (error) {
    // .env file doesn't exist or can't be read
  }
  return null;
}

// Create .firebaserc file
function createFirebaserc(projectId) {
  const firebasercPath = join(projectRoot, '.firebaserc');
  const content = `{
  "projects": {
    "default": "${projectId}"
  }
}
`;
  
  try {
    writeFileSync(firebasercPath, content, 'utf-8');
    console.log(`✅ Created .firebaserc with project ID: ${projectId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create .firebaserc:', error.message);
    return false;
  }
}

// Main execution
const projectId = getProjectId();

if (!projectId) {
  console.log('⚠️  Could not find VITE_PROJECT_ID in .env file');
  console.log('Please either:');
  console.log('1. Create a .env file with VITE_PROJECT_ID=your-project-id');
  console.log('2. Or manually create .firebaserc with your project ID');
  console.log('\nExample .firebaserc:');
  console.log('{');
  console.log('  "projects": {');
  console.log('    "default": "your-project-id"');
  console.log('  }');
  console.log('}');
  process.exit(1);
}

if (createFirebaserc(projectId)) {
  console.log('\n✅ Firebase configuration complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run firebase:login (or npx firebase login)');
  console.log('2. After logging in, you can deploy rules with: npm run firebase:deploy:rules');
} else {
  process.exit(1);
}

