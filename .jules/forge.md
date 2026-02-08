# Forge's Journal

## Critical Learnings

- **Agent Context Location**: Agent Context Files are located in `ai/rules/`, not `.jules/`. The prompt instructions were slightly drifted from the repo structure. The `.jules` directory is used for this journal and possibly other artifacts, but the source of truth for Agent Prompts is `ai/rules/*.md`.
- **CI Test Gaps**: The CI pipeline was only running `npm run test:integration`, which skipped unit tests in `src/lib/__tests__`. Remedied by standardizing on `npm run verify` which runs `npm run test` (covering all tests).
- **Loose Verification**: `scripts/verify.js` previously allowed integration tests to fail (`continueOnError: true`). This was removed to enforce strict quality gates in both local and CI environments.
- **Verification SSOT**: `scripts/verify.js` is now the single source of truth for verification. It supports `--skip-build` to allow the CI `test` job to verify without redundant builds, while maintaining logic parity with local dev.
