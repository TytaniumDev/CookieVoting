# Scribe's Journal

## Critical Learnings

- **AI Detection Implementation Drift**: The documentation (`README.md`, `PRD.md`, `GEMINI_SETUP.md`) persistently references "Google Gemini AI" for the core cookie detection feature. However, the production backend (`functions/src/index.ts`) implements **Google Cloud Vision API** (`ImageAnnotatorClient`) for this purpose. Gemini is _only_ used in a utility script (`scripts/detect-all-images.js`). This distinction is critical to avoid confusion for developers and users.

- **Black Box Resolved (Cookie Detection Pipeline)**: The core feature was previously opaque. It is a specific 2-step process:
  1.  **Detection**: `processCookieImage` uses Cloud Vision API to identify objects.
  2.  **Review & Crop**: `confirmCookieCrops` uses `sharp` to physically crop images after Admin approval.
  This is now fully documented in `docs/ARCHITECTURE.md`.

- **Terminology Standardization**: "Cookie Detection Pipeline" is the official term for the Upload -> Detect -> Review -> Crop workflow.
