# Specification - Cookie Detection & Cropping

## Goal
Establish a robust, manual-first cropping workflow with AI as a supportive tool, and ensure seamless real-time collaboration for the admin team.

## Scope
- **Manual Cropping:** "Butter smooth" interactions for creating, moving, and resizing crop boxes. Support for drag-to-create and keyboard shortcuts.
- **Unified Detection:** Single button/interface for detection within the Cropper tool, defaulting to Gemini but potentially keeping local blob detection as a fallback.
- **Detection Reliability:** Improve Gemini-based detection prompts and response parsing to reduce failures.
- **Admin Workflow:** Ensure the transition from "Image Upload" -> "Automated Detection" -> "Manual Refinement" -> "Baker Tagging" is frictionless.
- **Real-time Updates:** Ensure baker assignments and cropping changes are reflected instantly across all connected clients.

## Key Components
- `cookieDetectionGemini.ts`: The core utility for interacting with the Gemini API.
- `CookieCropper`: The UI component for reviewing and adjusting automated detections.
- `CroppedCookieTaggingGrid`: The grid where admins assign bakers to the final cutouts.
- `useImageStore`: State management for images and cookies (needs refactoring for real-time).

## Success Criteria
- Manual cropping is fast and intuitive on desktop and mobile (drag, resize, delete).
- The "Tag Cropped Cookies" page updates instantly when a baker is assigned on another device.
- Detection successfully identifies >90% of cookies in the standard test tray images.
- Admins can adjust detection boxes on mobile devices without lag or precision issues.
- All cropped cookies are correctly persisted to Firebase Storage and linked to the correct Baker in Firestore.
