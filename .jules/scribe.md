# Scribe's Journal

## Critical Learnings

- **AI Detection Implementation Drift**: The documentation (`README.md`, `PRD.md`, `GEMINI_SETUP.md`) persistently references "Google Gemini AI" for the core cookie detection feature. However, the production backend (`functions/src/index.ts`) implements **Google Cloud Vision API** (`ImageAnnotatorClient`) for this purpose. Gemini is _only_ used in a utility script (`scripts/detect-all-images.js`). This distinction is critical to avoid confusion for developers and users.
