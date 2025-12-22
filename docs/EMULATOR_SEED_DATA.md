# Firebase Emulator Seed Data

This document explains how to use seed data with Firebase emulators for development.

## Quick Start

1. **Start emulators with seed data (recommended)**:

   ```bash
   npm run emulators:start:seed
   ```

   This starts emulators and automatically imports existing seed data if available.

2. **Start emulators fresh and seed manually**:

   ```bash
   # Terminal 1: Start emulators
   npm run emulators:start

   # Terminal 2: Seed data (wait a few seconds for emulators to start)
   npm run emulators:seed
   ```

3. **Save emulator data (manual export - recommended for Windows)**:

   ```bash
   # Terminal 1: Start emulators
   npm run emulators:start

   # Terminal 2: Export data (while emulators are running)
   npm run emulators:export:manual
   ```

   This exports current emulator data to `./emulator-data/` directory.

4. **Start emulators with auto-export** (may hang on Windows):
   ```bash
   npm run emulators:start:fresh
   ```
   This starts emulators and automatically exports data when you stop them (Ctrl+C).
   ⚠️ **Note**: This may hang on Windows - use manual export instead.

## What Gets Seeded

The seed script creates:

1. **Test Admin User**:
   - Email: `test@local.dev`
   - Password: `test123456`
   - UID: `test-user-default`
   - Automatically added to admin list

2. **Admin Document**:
   - Collection: `system`
   - Document: `admins`
   - Contains: Array with test user UID

3. **Sample Event** (optional):
   - Name: "Sample Cookie Contest"
   - Status: "voting"
   - Created with a random ID and admin code

## Available Scripts

- `npm run emulators:start` - Start emulators (no import/export)
- `npm run emulators:start:seed` - Start emulators and import seed data
- `npm run emulators:start:fresh` - Start emulators with auto-export on exit (may hang on Windows)
- `npm run emulators:seed` - Seed data into running emulators
- `npm run emulators:export` - Export current emulator data (may hang on Windows)
- `npm run emulators:export:manual` - **Recommended for Windows**: Manual export using Admin SDK
- `npm run emulators:clear` - Clear exported emulator data

## Data Persistence

### Option 1: Manual Export/Import (Recommended, especially on Windows)

The built-in Firebase export command may hang on Windows. Use the manual export/import scripts instead:

**To Export:**

1. **Start emulators**:

   ```bash
   npm run emulators:start
   ```

2. **Export data manually** (in a separate terminal while emulators are running):
   ```bash
   npm run emulators:export:manual
   ```

**To Import:**

1. **Start emulators** (if not already running):

   ```bash
   npm run emulators:start
   ```

2. **Import data manually** (in a separate terminal while emulators are running):
   ```bash
   npm run emulators:import:manual
   ```

Data is stored in `./emulator-data/` directory.

**Note**: The manual export format is different from Firebase's native format. Use `emulators:import:manual` to import manual exports, not `emulators:start:seed`.

### Option 2: Auto-Export (May not work on Windows)

The emulators can automatically import/export data:

- **Import on start**: `npm run emulators:start:seed`
- **Export on exit**: `npm run emulators:start:fresh` (⚠️ may hang on Windows)

If auto-export hangs, use the manual export method above.

### Option 2: Manual Seeding

Run the seed script after starting emulators:

```bash
# Terminal 1
npm run emulators:start

# Terminal 2 (wait a few seconds)
npm run emulators:seed
```

## Customizing Seed Data

Edit `scripts/seed-emulator-data.js` to customize:

- Test user credentials
- Sample events
- Additional Firestore documents
- Storage files

## Environment Variables

- `CREATE_SAMPLE_EVENT=false` - Disable sample event creation
- `VITE_PROJECT_ID` - Project ID (defaults to 'demo-test')

## Tips

1. **First Time Setup**: Run `npm run emulators:seed` after starting emulators to create initial data.

2. **Persist Your Work**:
   - **Windows users**: Use `npm run emulators:export:manual` while emulators are running
   - **Other platforms**: Use `npm run emulators:start:fresh` to automatically save when you stop emulators

3. **Reset to Seed Data**:

   ```bash
   npm run emulators:clear
   npm run emulators:start:seed
   ```

4. **Share Seed Data**: Commit `emulator-data/` to git (remove from `.gitignore`) to share consistent seed data with your team.

## Troubleshooting

**"Emulators did not start in time"**

- Make sure emulators are running: `npm run emulators:start`
- Wait a few seconds after starting emulators before running seed script

**"User already exists"**

- This is normal - the script is idempotent and won't create duplicates

**"Permission denied"**

- Make sure you're using the emulator (not production Firebase)
- Check that emulators are connected correctly

**"Export request failed" or export hangs**

- This is a known issue on Windows with Firebase emulator export
- Use the manual export instead: `npm run emulators:export:manual` (while emulators are running)
- The manual export script uses the Admin SDK and works reliably on all platforms
