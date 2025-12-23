> ⚠️ **AUTO-GENERATED** — Do not edit. Edit `ai/rules/project-guidelines.md` instead.

---
trigger: always
description: Core project guidelines and development standards for the CookieVoting project.
---

# Project Guidelines & Standards

This document outlines the core development practices for the CookieVoting project.

## Core Principles

### 1. Thinking in React

Follow the 5-step process:

- Break UI into components.
- Build a static version.
- Minimize state.
- Identify state location.
- Add inverse data flow.

### 2. UI Development

- **No Firebase in UI**: Components must NEVER directly import Firebase services (`firestore`, `auth`, `storage`). All interactions must happen through custom hooks in `src/lib/hooks/`.
- **Storybook First**: Build all UI in Storybook before integration.
- **Automated Interaction Tests**: **REQUIRED**. Every complex component must have a Storybook story with a `play` function that verifies the critical user journey (e.g., clicking next after voting). This is strictly PREFERRED over manual verification or generic browser tests for UI logic.
- **Atomic Design**:
  - **Atoms**: Reusable UI primitives (Buttons, Inputs, Modals). Location: `src/components/atoms/`.
  - **Molecules**: Combinations of atoms with minimal logic. Location: `src/components/molecules/`.
  - **Organisms**: Complex, self-contained components or sections. Location: `src/components/organisms/`.
- **Accessibility**: Use semantic HTML, ARIA attributes, and ensure keyboard navigation.
- **Testability**:
  - Add unique `data-testid` or `id` attributes to all interactive elements to facilitate native tool selection.
  - Use clear, descriptive ARIA labels where visual labels aren't sufficient.

### 3. Firebase Resource Management

- **Security Rules**:
  - Firestore rules do NOT support `if` statements (use ternary).
  - No `const` or `let` in rules.
  - Multi-line conditionals should use `&&` or `||`.
- **Functions**:
  - Always build before deploying using `npm run build --prefix functions`.
  - Use `DETECTION_FUNCTION_VERSION` for tracking logic versions.

## Code Standards

### Naming Conventions

- **Components**: `PascalCase` (e.g., `CookieViewer.tsx`).
- **Props/Variables**: `camelCase`.
- **Hooks**: `use` prefix (e.g., `useAuth`).
- **Files**: Match component/class name.

- Keep state local whenever possible.
- Lift state to the lowest common ancestor.
- **Custom Hooks**: Extract all Firebase interaction and business logic into custom hooks. Hooks should handle loading/error states and provide clean APIs to components.
- **Utility Functions**: Move complex, non-React logic (e.g., sorting, coordinate calculations) to `src/lib/` utilities.

## Deployment & Verification

- **Build Before Reporting**: Make sure the app builds successfully before reporting a change.
- **Verify Before Reporting**: **REQUIRED**. Run `npm run verify` before reporting ANY code changes. This script mirrors the GitHub CI pipeline (Lint, Test, Build) and catches errors that would break the build. Fix ALL lint warnings and errors before reporting.
- **Efficient Verification**:
  - **Minimize Prompts**: To avoid excessive approval requests, prefer `read_url_content` for static state checks.
  - **NO Custom JS**: Custom JavaScript execution using browser tools is strictly FORBIDDEN unless no native alternative exists. Prefer native browser tools (click, get_text) to avoid the mandatory manual approval step.
  - **Interactive Tasks**: Use `browser_subagent` only for tasks requiring JS execution (e.g., Storybook, animations, complex navigation).
  - **Mission Batching**: Batch multiple verification steps into a single `browser_subagent` call to reduce the number of times the user needs to approve a subagent mission.
- **Automatic Debugging**: Attempt to fix testing failures automatically before informing the user.
- **Deployment**: Use `npm run firebase:deploy:*` scripts for safety.

## Local Emulator Development

- **Start Emulators**: Use `npm run emulators:start:seed` to start with a fresh test environment seeded with data.
- **Unified Auth**: No custom "test user" system exists. Use the standard "Sign in with Google" flow. The emulator will prompt you to select or create a mock account.
- **Admin Access**: The seeding script automatically adds `test@local.dev` (UID: `test-user-default`) to `system/admins`. Use this account for admin functionality.
- **Connectivity (Windows)**: Use `127.0.0.1` instead of `localhost` in Firebase configuration to avoid IPv6 connection timeouts.
