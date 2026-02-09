# AGENTS.md - Repository Briefing Packet
<!-- Source of Truth for Intent & High-Performance Collaboration -->

## 1. 🏗️ Tech Stack (Enforced)
- **Framework**: React 19 + Vite (Type `module`)
- **Language**: TypeScript 5.9+ (Strict Mode)
- **Styling**: Tailwind CSS 4 (Utility-first)
- **Backend**: Firebase 12 (Firestore, Functions, Storage, Auth)
- **Testing**: Vitest (Unit/Integration), Playwright (E2E), Storybook

## 2. ⚡ Key Commands (Executable)
<!-- Run these to verify your work -->
- **Verify All (SSOT)**: `npm run verify` (Lint, Typecheck, Test, Build)
- **Start Dev**: `npm run dev`
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`
- **Storybook**: `npm run storybook`
- **Deploy**: `npm run deploy` (requires auth)

## 3. 🛡️ Ground Rules (Hard Constraints)
- **No `any`**: Use strict TypeScript types.
- **No Inline Styles**: Use Tailwind classes.
- **No Logic in UI**: Move business logic to custom hooks (`lib/hooks`).
- **Test Before Commit**: Always run `npm run verify`.
- **Docs**: Update `docs/*.md` for major changes; `AGENTS.md` for high-level rules.

## 4. 📂 Key Directories
- `src/components/ui`: Shadcn/UI components (Do not modify unless necessary)
- `src/lib`: Core logic, hooks, and utilities
- `functions/src`: Cloud Functions (Backend logic)
- `ai/rules`: Agent instructions (Source for `CLAUDE.md`)

## 5. 🤖 Agent Instructions
- **Rule Source**: `ai/rules/*.md`
- **Sync Rules**: `npm run sync-agent-rules`
- **Memory**: Check `.jules/*.md` for project context and learnings.
