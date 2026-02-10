# Forge's Journal

## [CI/AGENTS.md Calibration]
- **Found:** `scripts/verify.js` does not match the memory's description (missing `--skip-build` support, incorrect `continueOnError`).
- **Found:** `.github/workflows/deploy.yml` uses individual steps instead of the consolidated `npm run verify` script.
- **Action:** Updating `scripts/verify.js` to be the single source of truth for verification.
- **Action:** Updating `.github/workflows/deploy.yml` to use `npm run verify` for consistency.
- **Action:** Creating `AGENTS.md` to document the intended workflow and serve as the AI briefing packet.
