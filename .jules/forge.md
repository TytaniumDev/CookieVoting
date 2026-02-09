# Forge's Journal

## Critical Learnings

- **Agent Context Location**: Agent Context Files are located in `ai/rules/`, not `.jules/`. The prompt instructions were slightly drifted from the repo structure. The `.jules` directory is used for this journal and possibly other artifacts, but the source of truth for Agent Prompts is `ai/rules/*.md`.

- **AGENTS.md vs CLAUDE.md**: `AGENTS.md` is now the concise SSOT for intent and executable commands, while `CLAUDE.md` (and `ai/rules/*.md`) remains the source for detailed coding standards and agent persona instructions. `AGENTS.md` serves as the high-level entry point.
