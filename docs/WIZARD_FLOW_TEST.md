# Wizard Flow Integration Test

## Overview

A comprehensive integration test has been created that validates the entire wizard flow from start to finish. This test verifies:

1. ✅ Event creation
2. ✅ Image upload (3 images)
3. ✅ Category naming (3 categories)
4. ✅ Baker/chef addition (4 bakers)
5. ✅ Cookie tagging (2 cookies per baker per category)
6. ✅ Data verification on AdminHome page
7. ✅ Data verification on AdminDashboard page
8. ✅ Data verification on VotingPage
9. ✅ Firestore document structure validation

## Test File

The test is located at: `tests/integration/wizard-flow.test.ts`

## Test Flow

The test follows this exact sequence:

### Step 1: Create Event
- Creates a test event named "Test Wizard Event"
- Verifies event is created with correct status

### Step 2: Upload 3 Images
- Creates 3 mock PNG image files (1x1 pixel transparent images)
- Uploads them to Firebase Storage emulator
- Verifies all images are uploaded successfully

### Step 3: Create Categories
- Creates 3 categories with names:
  - "Sugar Cookies"
  - "Chocolate Chip"
  - "Gingerbread"
- Associates each category with an uploaded image
- Verifies categories are saved in Firestore

### Step 4: Add 4 Bakers
- Adds 4 bakers/chefs:
  - "Alice"
  - "Bob"
  - "Charlie"
  - "Diana"
- Verifies bakers are saved in Firestore

### Step 5: Tag Cookies
- Tags 2 cookies per baker per category (24 total cookies: 3 categories × 4 bakers × 2 cookies)
- Cookies are positioned with different coordinates
- Cookies are sorted and numbered correctly (top to bottom, left to right)
- Verifies all cookies are saved with correct data

### Step 6-8: Data Verification
- **AdminHome**: Verifies event appears in event list with images
- **AdminDashboard**: Verifies event details, categories, bakers, and cookies
- **VotingPage**: Verifies categories and cookies are ready for voting

## Running the Test

### Prerequisites

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start Firebase Emulators** (in a separate terminal):
   ```bash
   npm run emulators:start
   ```
   
   Wait for output: `✔  All emulators ready! It is now safe to connect.`

### Run the Test

```bash
# Run just the wizard flow test
npm run test:integration -- tests/integration/wizard-flow.test.ts

# Or run all integration tests
npm run test:integration
```

### Expected Output

The test should output:
```
✅ Event created: <event-id>
✅ Uploaded 3 images
✅ Created 3 categories
✅ Added 4 bakers
✅ Tagged cookies for all categories
✅ All wizard steps completed successfully!
✅ Event data verified on AdminHome
✅ Event data verified on AdminDashboard
✅ Event data verified on VotingPage
✅ Cookie tagging data structure verified
✅ Firestore document structure verified
```

## Test Data Structure

### Categories
- 3 categories total
- Each has a unique name and image URL

### Bakers
- 4 bakers total
- Each baker has a unique name and ID

### Cookies
- 8 cookies per category (2 per baker × 4 bakers)
- 24 cookies total (8 × 3 categories)
- Each cookie has:
  - Unique ID
  - Sequential number (1-8 per category)
  - Maker name (baker name)
  - X and Y coordinates (percentages)

## What the Test Validates

### Data Integrity
- ✅ All data is saved correctly in Firestore
- ✅ Categories have correct names and image URLs
- ✅ Bakers are saved with correct names
- ✅ Cookies are tagged with correct coordinates and maker names
- ✅ Cookie numbers are sequential and correct

### Data Retrieval
- ✅ `getAllEvents()` returns the test event
- ✅ `getEvent()` returns correct event details
- ✅ `getCategories()` returns all 3 categories with cookies
- ✅ `getBakers()` returns all 4 bakers

### Data Structure
- ✅ Event document structure is correct
- ✅ Category subcollection structure is correct
- ✅ Baker subcollection structure is correct
- ✅ Cookie data structure (numbers, coordinates, maker names) is correct

### Page-Specific Verification
- ✅ **AdminHome**: Event appears with images in carousel
- ✅ **AdminDashboard**: All event data is accessible
- ✅ **VotingPage**: Categories and cookies are ready for voting

## Troubleshooting

### Error: "Failed to connect to Firebase Authentication Emulator"
**Solution**: Make sure emulators are running:
```bash
npm run emulators:start
```

### Error: "Cannot find module 'firebase-admin'"
**Solution**: Install dependencies:
```bash
npm install
```

### Error: "Permission denied"
**Solution**: The test user should be automatically set up as admin. If this fails:
1. Check that `setupTestUser()` is called in `beforeAll`
2. Verify emulators are running
3. Check console output for admin setup messages

### Test times out
**Solution**: 
1. Make sure emulators are running and ready
2. Check that ports 9099, 8080, and 9199 are available
3. Increase Jest timeout if needed (default is 5000ms)

## Next Steps

After running this test successfully, you can:

1. **Add more test cases** for edge cases:
   - Empty categories
   - Single baker
   - Many cookies per category
   - Duplicate baker names (should be prevented)

2. **Add E2E tests** using Playwright to test the actual UI:
   - Test clicking through the wizard UI
   - Test image upload via file input
   - Test cookie tagging via image clicks

3. **Add performance tests**:
   - Test with many categories (10+)
   - Test with many bakers (10+)
   - Test with many cookies (100+)

## Integration with CI/CD

This test is designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Start Firebase Emulators
  run: npm run emulators:start &
  env:
    FIREBASE_EMULATOR: true

- name: Wait for emulators
  run: sleep 10

- name: Run wizard flow test
  run: npm run test:integration -- tests/integration/wizard-flow.test.ts
  env:
    FIREBASE_EMULATOR: true
```

The test uses Firebase Emulators, so no real Firebase credentials are needed!

