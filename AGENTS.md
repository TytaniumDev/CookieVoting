# 🤖 AGENTS.md - The Briefing Packet

> **Identity**: Cookie Voting (React 19, Firebase 12, Tailwind 4, Vite)
> **Mission**: Build a robust, voting platform with "Detect-Review-Crop" pipeline.

## 🚨 Critical Instructions
1. **Source of Truth**:
   - **Intent**: This file (`AGENTS.md`).
   - **Execution**: `.github/workflows/deploy.yml`.
   - **Agent Rules**: `ai/rules/*.md` (Run `npm run sync-agent-rules` after editing).
2. **Golden Rule**: Never break the build. Run `npm run verify` before committing.
3. **Documentation**: strict "No-Drift" policy. Update docs *with* code changes.

## 🛠️ Build & Verification
Use these executable commands. Do not deviate.

- **Setup**: `npm ci && npm run setup`
- **Verify (Local)**: `npm run verify` (Lint, Test, Build)
- **Lint**: `npm run lint` (ESLint)
- **Unit Tests**: `npm run test` (Vitest)
- **Integration Tests**: `npm run test:integration` (Vitest + Emulators)
- **Component Tests**: `npm run test-storybook` (Storybook Interaction)
- **E2E Tests**: `npm run test:e2e` (Playwright)
- **Build**: `npm run build` (TSC + Vite)

## 🚀 Deployment
**CI/CD**: Deploys on push to `main`.
- **Manual Deploy**: `npm run deploy` (Hosting only)
- **Full Deploy**: `firebase deploy` (Requires auth)
- **Functions**: `npm run firebase:deploy:functions`

## 🏗️ Architecture & Standards
- **Frontend**: `src/` (React 19 + Tailwind 4). No direct Firebase in components (use hooks).
- **Backend**: `functions/` (Node 20). strict isolation.
- **Testing**:
  - **Unit**: Logic/Utils (Vitest)
  - **Integration**: Emulators (Vitest)
  - **E2E**: Critical Flows (Playwright)
- **Styling**: Tailwind utility-first. No arbitrary values (use `bg-primary`, not `bg-[#...]`).

## 📂 Key Directories
- `ai/rules/`: **Edit rules here**. (Generates CLAUDE.md, etc.)
- `src/components/ui/`: Shadcn components.
- `src/lib/`: Business logic & hooks.
- `tests/integration/`: Backend integration tests.
- `scripts/`: Automation scripts (Kickstart).
