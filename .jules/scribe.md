# Scribe's Journal

## Critical Learnings

- **AI Detection Implementation Drift**: The documentation (`README.md`, `PRD.md`, `GEMINI_SETUP.md`) persistently references "Google Gemini AI" for the core cookie detection feature. However, the production backend (`functions/src/index.ts`) implements **Google Cloud Vision API** (`ImageAnnotatorClient`) for this purpose. Gemini is _only_ used in a utility script (`scripts/detect-all-images.js`). This distinction is critical to avoid confusion for developers and users.

- **Documentation Library Expansion**: Created `ARCHITECTURE.md`, `API.md`, and `CONTRIBUTING.md` to address missing technical documentation. These files now serve as the primary source of truth for system design, API references, and contributor workflows.

- **CI Workflow Discrepancy**: The project memory stated that `npm run verify` is used in CI with a `--skip-build` flag. However, inspection of `.github/workflows/deploy.yml` reveals that the CI pipeline runs individual steps (`lint`, `test:integration`, `test-storybook`) directly and does not utilize the `verify` script. `CONTRIBUTING.md` has been updated to reflect the current state, recommending `npm run verify` as a local convenience script.

- **Gemini vs Vision API Clarification**: Explicitly documented in `ARCHITECTURE.md` that the production environment exclusively uses Google Cloud Vision API. This resolves the confusion noted in the previous journal entry regarding the "AI Detection Implementation Drift".
