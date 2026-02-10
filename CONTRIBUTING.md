# Contributing to CookieVoting

Thank you for your interest in contributing! This document outlines the development workflow, testing standards, and documentation guidelines.

## 1. Getting Started

### Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Docker (for Playwright testing, optional but recommended)

### Setup
Run the setup script to install dependencies and configure the environment:

```bash
bash scripts/setup.sh
```

This will:
- Install project dependencies (`npm install`).
- Install Cloud Functions dependencies (`npm install --prefix functions`).
- Verify your environment setup.

## 2. Development Workflow

### Verification (Single Source of Truth)
We use a unified verification script to ensure code quality. **Always run this before pushing changes.**

```bash
npm run verify
```

This command runs:
- **Linting**: ESLint + Prettier.
- **Type Checking**: TypeScript (`tsc`).
- **Unit Tests**: Vitest.
- **Build**: Vite build.

To skip the build step for faster feedback during local dev:
```bash
npm run verify -- --skip-build
```

### Local Emulators
To develop locally without affecting production data:

```bash
npm run emulators:start
```
This spins up Firestore, Auth, Storage, and Functions emulators.

## 3. Testing Strategy

We employ a "Testing Pyramid" approach:

### Unit & Integration Testing (`vitest`)
Located in `src/tests/` and `functions/src/tests/`.
- Run all unit tests: `npm run test`
- Run integration tests: `npm run test:integration`

### End-to-End Testing (`playwright`)
Located in `tests/e2e/`. These tests verify the full user journey.
- Run E2E tests: `npm run test:e2e`
- Run with UI: `npm run test:e2e:ui`

**Note**: Playwright tests require the local dev server and emulators to be running.

## 4. Documentation Standards

We follow a strict "Persona-Based" documentation model to prevent drift.

### 📜 Scribe (Technical Librarian)
- **Responsibility**: Maintains `ARCHITECTURE.md`, `API.md`, `CONTRIBUTING.md`.
- **Scope**: Deep technical dives, schema definitions, system diagrams.
- **Rule**: Never edits `README.md`.

### 🌟 Showcase (Product Owner)
- **Responsibility**: Maintains `README.md`.
- **Scope**: High-level product overview, features, "hook", and quick start.
- **Rule**: Only links to Scribe's documents; doesn't duplicate technical details.

## 5. Agent Rules

If you are an AI agent or using AI tools, ensure you are following the latest project rules.
The rules are located in `ai/rules/` and synchronized to IDE-specific files via:

```bash
bash scripts/sync-agent-rules.sh
```
This script is automatically run before `npm run dev` and `npm run build`.
