# Test Suite Documentation

This directory contains both integration tests and E2E browser tests for the Cookie Voting application.

## Test Structure

```
tests/
├── integration/           # Integration tests (programmatic Firebase operations)
│   ├── event-operations.test.ts
│   ├── setup.ts
│   └── firebase-test-init.ts
└── e2e/                   # E2E browser tests (Playwright UI automation)
    ├── event-operations.spec.ts
    └── fixtures.ts
```

## Integration Tests

Integration tests verify Firebase operations programmatically using **Firebase Local Emulator Suite** with mock ID tokens. This approach:

- ✅ **No real credentials required** - Uses emulators, not production Firebase
- ✅ **Programmatic authentication** - Creates users with specific UIDs and properties
- ✅ **Isolated testing** - Each test run starts with a clean emulator state
- ✅ **CI/CD friendly** - Works in non-interactive environments like GitHub Actions
- ✅ **Fast execution** - Emulators run locally, no network latency

### Setup

1. **Create `.env.test` file** in the project root (optional, defaults work with emulators):
   ```
   VITE_API_KEY=demo-api-key
   VITE_AUTH_DOMAIN=demo-test.firebaseapp.com
   VITE_PROJECT_ID=demo-test
   VITE_STORAGE_BUCKET=demo-test.appspot.com
   VITE_MESSAGING_SENDER_ID=123456789
   VITE_APP_ID=1:123456789:web:abcdef
   ```

2. **Start Firebase Emulators** (required before running tests):
   ```bash
   # Start emulators in one terminal
   npm run emulators:start
   
   # In another terminal, run tests
   npm run test:integration
   ```

   Or run tests with emulators automatically:
   ```bash
   # This will start emulators, run tests, then stop emulators
   npm run test:integration:emulator
   ```

3. **How It Works**:
   - Tests connect to local emulators (Auth, Firestore, Storage)
   - Mock users are created programmatically using Firebase Admin SDK
   - Custom tokens are generated for authentication
   - No real Firebase project or credentials needed

### What Integration Tests Verify

- ✅ Event creation in `test_events` collection
- ✅ Event status updates (voting ↔ completed)
- ✅ Event deletion (including subcollections)
- ✅ Event retrieval
- ✅ Test user authentication and admin status
- ✅ Full CRUD cycle

## E2E Browser Tests

E2E tests use Playwright to automate browser interactions and verify complete UI flows.

### Setup

1. **Install Playwright browsers** (first time only):
   ```bash
   npm run playwright:install
   ```

2. **Run tests**:
   ```bash
   # Run E2E tests (dev server will start automatically)
   npm run test:e2e
   
   # Run with UI mode (interactive)
   npm run test:e2e:ui
   ```

### What E2E Tests Verify

- ✅ Sign in flow (test user authentication)
- ✅ Event creation via UI form
- ✅ Event status modification via UI buttons
- ✅ Event deletion via UI (including confirmation modal)
- ✅ Loading states and UI feedback
- ✅ Navigation and routing
- ✅ Full user workflow

## Running All Tests

Run both integration and E2E tests:
```bash
npm run test:all
```

## Test Database Isolation

Both test suites use the **test database** (`test_*` collections) to avoid affecting production data:
- Integration tests: `test_events`, `test_system`
- E2E tests: Same test database via UI

## Troubleshooting

### Integration Tests

**Error: "Failed to connect to Firebase Authentication Emulator"**
- Make sure emulators are running: `npm run emulators:start`
- Check that ports 9099 (Auth), 8080 (Firestore), and 9199 (Storage) are available
- Verify `firebase.json` has emulator configuration

**Error: "Firebase configuration is missing"**
- Ensure `.env.test` exists (or use default demo values)
- Check that `../config/jest.setup.js` loads the `.env.test` file
- Note: With emulators, exact config values don't matter

**Error: "Permission denied"**
- The test user is automatically created as admin via `ensureTestUserIsAdmin()`
- If this fails, check that Firestore emulator is running
- Verify emulator connection in test output

**Error: "Cannot find module 'firebase-admin'"**
- Install dependencies: `npm install`
- `firebase-admin` should be in `devDependencies`

### E2E Tests

**Error: "Cannot find browser"**
- Run `npm run playwright:install` to install browsers

**Error: "Connection refused" or "ECONNREFUSED"**
- Ensure dev server can start on port 5173
- Check that no other process is using port 5173
- The Playwright config should start the server automatically

**Tests timeout or fail**
- Increase timeout in `../config/playwright.config.ts` if needed
- Check that Firebase is properly configured
- Verify test user can authenticate (check browser console)

## Test Files Overview

### `tests/integration/firebase-test-init.ts`
- Initializes Firebase app for testing
- Connects to Firebase Emulators (Auth, Firestore, Storage)
- Exports shared `testAuth`, `testDb`, `testStorage` instances
- Ensures all test files use the same Firebase app

### `tests/integration/mock-auth.ts`
- **Mock ID token generator** using Firebase Admin SDK
- `createMockUserAndSignIn()` - Creates user in emulator and signs in
- Generates custom tokens for programmatic authentication
- Supports custom claims for role-based testing

### `tests/integration/setup.ts`
- Test utilities and helpers
- `setupTestUser()` - Creates mock user via emulator and ensures admin status
- `cleanupTestEvents()` - Cleans up test data after tests
- `trackEventId()` - Tracks created events for cleanup

### `tests/integration/event-operations.test.ts`
- Integration test suite
- Tests create, read, update, delete operations
- Verifies Firestore rules and data persistence

### `tests/integration/wizard-flow.test.ts`
- **Comprehensive wizard flow test**
- Tests the complete wizard flow: event creation → image upload → category naming → baker addition → cookie tagging
- Validates data appears correctly on AdminHome, AdminDashboard, and VotingPage
- Verifies Firestore document structure and data integrity
- See `../docs/WIZARD_FLOW_TEST.md` for detailed documentation

### `tests/e2e/fixtures.ts`
- Playwright fixtures and helper functions
- `createEventViaUI()` - Helper to create events through UI
- `deleteEventViaUI()` - Helper to delete events through UI
- `toggleEventStatus()` - Helper to change event status

### `tests/e2e/event-operations.spec.ts`
- E2E test suite
- Tests complete UI workflows
- Verifies user interactions and UI state changes

## CI/CD Integration

Both test suites can run in CI/CD pipelines:

**Integration Tests:**
- Fast execution (< 5 seconds per test)
- No browser required
- Uses Firebase Emulators (no real Firebase project needed)
- Works perfectly in GitHub Actions and other CI environments
- No API keys or credentials required

**E2E Tests:**
- Requires browser (Playwright handles this)
- Slower execution (~30 seconds per test)
- Can run in headless mode in CI

Example CI configuration (GitHub Actions):
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npm run playwright:install
      
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
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Stop emulators
        run: pkill -f firebase
```

## Benefits of Emulator-Based Testing

1. **No Real Credentials**: Tests run against local emulators, not production Firebase
2. **Programmatic Users**: Create users with specific UIDs, emails, and custom claims
3. **Isolated Tests**: Each test run starts fresh (emulators reset between runs)
4. **Fast**: No network calls to Firebase servers
5. **CI/CD Ready**: Works in non-interactive environments
6. **Cost-Free**: No Firebase usage costs for testing


