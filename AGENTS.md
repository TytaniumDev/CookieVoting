# AGENTS.md - Repository Briefing Packet

> **Identity**: Cookie Voting App (React 19 + Firebase 12)
> **Role**: AI Collaborator (Forge/Scribe/Showcase)
> **SSOT**: This file (`AGENTS.md`) is the source of truth for high-level intent. `ai/rules/` contains detailed standards.

## ⚡ Core Commands (Executable)

```bash
# 1. Start Development Environment (with Firebase emulators)
npm run dev

# 2. Verify Changes (Lint, Test, Build) - RUN BEFORE COMMIT
npm run verify

# 3. Sync Agent Rules (if you edited ai/rules/*)
npm run sync-agent-rules

# 4. Deploy (requires auth)
npm run deploy
```

## 🛑 Hard Constraints

1.  **Generated Files**: NEVER edit `CLAUDE.md`, `.cursor/rules/*`, or `GEMINI.md` directly. Edit `ai/rules/*.md` and run `npm run sync-agent-rules`.
2.  **Code Style**: Use `npm run lint` and `npm run format`.
3.  **Testing**: New features MUST have tests. Run `npm run test:all` or `npm run verify`.
4.  **Architecture**:
    *   **Frontend**: React 19, Tailwind 4, Vite.
    *   **Backend**: Firebase (Firestore, Functions, Storage, Auth).
    *   **No Firebase in Components**: Use hooks in `src/lib/hooks`.
5.  **Documentation**: Keep docs concise. Prefer `ai/rules/*.md` for standards.

## 📂 Documentation Map

*   `ai/rules/`: Detailed coding standards (React, Firebase, Testing).
*   `docs/`: Feature-specific documentation.
*   `scripts/`: Automation scripts (use these over manual commands).

## 🔨 CI/CD Pipeline

*   **Trigger**: Push to `main`.
*   **Checks**: Lint, Integration Tests, Storybook Tests, Build, Agent Rules Sync.
*   **Deploy**: Firebase Hosting & Functions.
*   **Agent Sync**: CI verifies that `ai/rules/` matches generated files.
