# Scribe's Journal

## Critical Learnings

- **AI Detection Implementation Drift**: The documentation (`README.md`, `PRD.md`, `GEMINI_SETUP.md`) persistently references "Google Gemini AI" for the core cookie detection feature. However, the production backend (`functions/src/index.ts`) implements **Google Cloud Vision API** (`ImageAnnotatorClient`) for this purpose. Gemini is _only_ used in a utility script (`scripts/detect-all-images.js`). This distinction is critical to avoid confusion for developers and users.
- **Drift Resolution (2024-05-23)**: To resolve the confusion between Vision API and Gemini, I created `docs/ARCHITECTURE.md` as the single source of truth. It explicitly diagrams the two separate pipelines: "Assisted Cookie Detection" (Production) using Vision API + Review, and "Experimental Script" using Gemini. I also updated `docs/VisionAPI.md` to reflect the actual v2 implementation and renamed `GEMINI_SCRIPT_SETUP.md` to `GEMINI_SETUP.md` to fix broken links.
