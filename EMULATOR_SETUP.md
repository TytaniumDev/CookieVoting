# Firebase Emulator Setup Guide

This document explains the new Firebase Authentication Emulator setup for integration tests and the next steps to complete the migration.

## What Was Implemented

### 1. Firebase Emulator Configuration
- ✅ Added emulator configuration to `firebase.json`
- ✅ Configured Auth (port 9099), Firestore (port 8080), and Storage (port 9199) emulators
- ✅ Enabled emulator UI (port 4000)

### 2. Mock ID Token Generator
- ✅ Created `tests/integration/mock-auth.ts`
- ✅ Uses Firebase Admin SDK to create users programmatically
- ✅ Generates custom tokens for authentication
- ✅ Supports custom claims for role-based testing

### 3. Test Infrastructure Updates
- ✅ Updated `tests/integration/firebase-test-init.ts` to connect to emulators
- ✅ Updated `tests/integration/setup.ts` to use mock ID tokens instead of anonymous auth
- ✅ Added automatic emulator connection with fallback handling

### 4. Package Dependencies
- ✅ Added `firebase-admin` to `devDependencies`
- ✅ Added npm scripts for emulator management

### 5. Documentation
- ✅ Updated `tests/README.md` with emulator instructions
- ✅ Added CI/CD examples for GitHub Actions

## Next Steps

### Step 1: Install Dependencies
```bash
npm install
```

This will install `firebase-admin` which is required for generating mock ID tokens.

### Step 2: Test the Setup Locally

1. **Start the emulators**:
   ```bash
   npm run emulators:start
   ```

   You should see output like:
   ```
   ✔  All emulators ready! It is now safe to connect.
   i  View Emulator UI at http://localhost:4000
   ```

2. **In another terminal, run the integration tests**:
   ```bash
   npm run test:integration
   ```

   The tests should:
   - Connect to the emulators automatically
   - Create mock users with specific UIDs
   - Sign in using custom tokens
   - Run all test cases successfully

### Step 3: Verify Emulator UI

1. Open http://localhost:4000 in your browser
2. You should see the Firebase Emulator Suite UI
3. Check the Authentication tab - you should see test users created during test runs
4. Check the Firestore tab - you should see `test_events` and `test_system` collections

### Step 4: Update CI/CD Pipeline (if applicable)

If you have a GitHub Actions workflow or other CI/CD setup, update it to:

1. Start Firebase emulators before running tests
2. Set `FIREBASE_EMULATOR=true` environment variable
3. Wait for emulators to be ready before running tests

Example GitHub Actions step:
```yaml
- name: Start Firebase Emulators
  run: npm run emulators:start &
  env:
    FIREBASE_EMULATOR: true

- name: Wait for emulators
  run: sleep 10

- name: Run integration tests
  run: npm run test:integration
  env:
    FIREBASE_EMULATOR: true
```

## How It Works

### Before (Anonymous Auth)
1. Tests used real Firebase project
2. Required anonymous authentication to be enabled
3. Created anonymous users with random UIDs
4. Required manual admin setup

### After (Emulator + Mock ID Tokens)
1. Tests use local Firebase emulators
2. No real Firebase project needed
3. Creates users programmatically with specific UIDs
4. Automatically sets up admin status
5. Works in CI/CD without credentials

### Mock User Creation Flow

```typescript
// 1. Create user in emulator via Admin SDK
await adminAuth.createUser({
  uid: 'test-user-integration',
  email: 'test-user-integration@test.local',
  emailVerified: true,
});

// 2. Generate custom token
const customToken = await adminAuth.createCustomToken(uid);

// 3. Sign in with custom token
const userCredential = await signInWithCustomToken(auth, customToken);
```

## Benefits

1. **No Real Credentials**: Tests don't touch production Firebase
2. **Programmatic Users**: Create users with exact properties you need
3. **Isolated Testing**: Each test run starts fresh
4. **CI/CD Friendly**: Works in non-interactive environments
5. **Fast**: No network latency to Firebase servers
6. **Cost-Free**: No Firebase usage costs

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
**Solution**: Run `npm install` to install dependencies

### Error: "Failed to connect to Firebase Authentication Emulator"
**Solution**: 
1. Make sure emulators are running: `npm run emulators:start`
2. Check that ports 9099, 8080, and 9199 are not in use
3. Verify `firebase.json` has emulator configuration

### Error: "Emulator connection already initialized"
**Solution**: This is normal - the code handles this gracefully. It means emulators are already connected.

### Tests fail with permission errors
**Solution**: 
1. Check that Firestore emulator is running
2. Verify `ensureTestUserIsAdmin()` is being called in `setupTestUser()`
3. Check emulator UI to see if test user was created

## Custom Claims Example

You can create users with custom claims for role-based testing:

```typescript
const user = await setupTestUser({
  uid: 'admin-user',
  email: 'admin@test.local',
  customClaims: {
    admin: true,
    role: 'super-admin',
  },
});
```

These claims will be available in Firestore security rules via `request.auth.token.admin` and `request.auth.token.role`.

## Questions?

Refer to:
- `tests/README.md` - Full test documentation
- `tests/integration/mock-auth.ts` - Mock auth implementation
- Firebase Emulator docs: https://firebase.google.com/docs/emulator-suite

