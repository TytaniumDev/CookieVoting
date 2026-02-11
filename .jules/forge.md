# Forge's Journal

## Critical Learnings

- **Agent Context Location**: Agent Context Files are located in `ai/rules/`, not `.jules/`. The prompt instructions were slightly drifted from the repo structure. The `.jules` directory is used for this journal and possibly other artifacts, but the source of truth for Agent Prompts is `ai/rules/*.md`.

## System Updates

- **AGENTS.md Creation**: Created `AGENTS.md` in the root directory as the high-level "Briefing Packet" and SSOT for intent. It references `ai/rules/` for detailed standards.
- **CI/CD Optimization**: Added `npm run sync-agent-rules:check` to the CI pipeline (`.github/workflows/deploy.yml`) to ensure generated agent files (e.g., `CLAUDE.md`) remain synchronized with the source of truth in `ai/rules/`.
