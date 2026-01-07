# Specification - Cookie Detection & Cropping

## Goal
Polish the automated cookie detection system, improve cropping accuracy, and refine the admin workflow for assigning bakers to these cropped images.

## Scope
- **Detection Reliability:** Improve Gemini-based detection prompts and response parsing to reduce failures.
- **Cropping Logic:** Refine the math and UI for cropping individual cookies from high-resolution tray photos.
- **Admin Workflow:** Ensure the transition from "Image Upload" -> "Automated Detection" -> "Manual Refinement" -> "Baker Tagging" is frictionless.
- **Accuracy Verification:** Establish a baseline for detection accuracy using the existing test image set.

## Key Components
- `cookieDetectionGemini.ts`: The core utility for interacting with the Gemini API.
- `CookieCropper`: The UI component for reviewing and adjusting automated detections.
- `CroppedCookieTaggingGrid`: The grid where admins assign bakers to the final cutouts.

## Success Criteria
- Detection successfully identifies >90% of cookies in the standard test tray images.
- Admins can adjust detection boxes on mobile devices without lag or precision issues.
- All cropped cookies are correctly persisted to Firebase Storage and linked to the correct Baker in Firestore.
