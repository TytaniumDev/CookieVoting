# 🤖 Agent Briefing Packet

**Status:** ACTIVE | **Role:** Forge | **Goal:** Verification Parity

This file is the **Source of Truth for Intent**. Code execution follows `scripts/verify.js`.

## 🚨 Critical Rules
1. **Always Verify:** Run `npm run verify` before pushing.
2. **Strict Types:** No `any` in new code.
3. **Test First:** Create/Update tests for all logic changes.
4. **No Secrets:** Never commit credentials.
5. **UI Components:** Follow `ai/rules/ui-components.md`.

## 🛠️ Development Workflow

### Setup
```bash
npm ci
npm run setup
```

### Verification (Local)
Runs Lint, Integration Tests, Storybook Tests, and Build.
```bash
npm run verify
```

### Verification (CI Mode)
Skips build step (handled by separate job).
```bash
npm run verify -- --skip-build
```

### Testing
```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests (Playwright)
```

## 🏗️ Architecture & Standards

- **Tech Stack:** React 19, TypeScript, Vite, TailwindCSS, Firebase.
- **Styling:** TailwindCSS with `shadcn/ui`.
- **State:** Zustand.
- **Testing:** Vitest (Unit/Integration), Playwright (E2E).

See `ai/rules/` for detailed coding standards.
