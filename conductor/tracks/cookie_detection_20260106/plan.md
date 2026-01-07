# Plan - Cookie Detection & Cropping

## Phase 1: Detection Reliability & Utilities
- [x] Task: Improve Gemini detection prompt and response parsing for better reliability. 07e7d02
- [x] Task: Implement robust error handling and fallback logic in `cookieDetectionGemini.ts`. 5720c78
- [ ] Task: Write unit tests for detection utility functions (coordinate transformation, scaling).
- [ ] Task: Conductor - User Manual Verification 'Detection Reliability' (Protocol in workflow.md)

## Phase 2: UI Refinement & Mobile Experience
- [ ] Task: Refine the `CookieCropper` component to handle overlapping or edge-of-image detections.
- [ ] Task: Improve the mobile drawer experience for tagging and adjusting boxes in `CookieCropper`.
- [ ] Task: Ensure the `DetectionToolbar` provides clear status updates during the detection process.
- [ ] Task: Conductor - User Manual Verification 'UI Refinement' (Protocol in workflow.md)

## Phase 3: Integration & Baker Tagging
- [ ] Task: Optimize the `CroppedCookieTaggingGrid` for performance when handling 20+ cookie cutouts.
- [ ] Task: Verify that baker assignments and crop coordinates are correctly persisted in Firestore.
- [ ] Task: Conduct a full end-to-end audit of the admin flow from image upload to final tagging.
- [ ] Task: Conductor - User Manual Verification 'Integration & Tagging' (Protocol in workflow.md)
