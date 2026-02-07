# AGENTS.md - Repository Briefing Packet

> **Source of Truth:** This file is the SSOT for *intent*. The Pipeline (`.github/workflows/deploy.yml`) is the SSOT for *execution*.

## 1. Ground Rules
- **Codebase:** React 19 (Vite), TypeScript, TailwindCSS, Firebase (Auth, Firestore, Storage, Functions).
- **Documentation:** See `docs/` for details.
  - [Testing Strategy](docs/TESTING_STRATEGY.md)
  - [Testing Guide](docs/TESTING_GUIDE.md)
  - [Emulator Setup](docs/EMULATOR_SETUP.md)
- **Environment:**
  - Node.js 20+, npm 10+.
  - `VITE_USE_EMULATOR=true` for local dev without prod credentials.
- **Commit Standards:**
  - Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
  - Run `npm run verify` before pushing.

## 2. Executable Commands

### Setup
Initialize a fresh environment (install dependencies, setup emulators):
```bash
bash scripts/setup.sh
```

### Verification (Lint, Test, Build)
Run the full verification suite (same as Pre-Commit):
```bash
npm run verify
```

### Testing
Run Unit & Integration tests (Vitest):
```bash
npm test
```

Run End-to-End tests (Playwright):
```bash
npm run test:e2e
```

Run Storybook tests (Component Interactions):
```bash
npm run test-storybook
```

### Build
Build the production application:
```bash
npm run build
```

### Deploy
Deploy to Firebase Hosting (requires credentials):
```bash
npm run deploy
```

## 3. Architecture
- **Frontend:** `src/` (Atomic Design: atoms, molecules, organisms).
- **Backend:** `functions/` (Firebase Cloud Functions).
- **Tests:** `tests/` (Integration/E2E), `src/**/*.test.tsx` (Unit).
