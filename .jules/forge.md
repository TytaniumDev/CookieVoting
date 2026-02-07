# Forge's Journal

## Critical Learnings

- **Testing Strategy Consolidation**: `npm test` runs both unit and integration tests (via Vitest project `unit` including `tests/` and `src/`). CI previously only ran `test:integration`, skipping unit tests. This gap has been closed.
- **Documentation Organization**: Moved `TESTING_STRATEGY.md` to `docs/` to reduce root clutter. `AGENTS.md` established as SSOT for intent.
