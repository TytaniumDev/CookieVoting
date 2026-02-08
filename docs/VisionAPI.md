# Vision API Implementation Guide

> **Status**: Production
> **Source**: `functions/src/index.ts`

This document details the implementation of the "Assisted Cookie Detection Pipeline" using Google Cloud Vision API and Firebase Cloud Functions.

## 1. Architecture Overview

The pipeline is designed to be "Assisted AI", meaning the AI suggests bounding boxes, but a human administrator must review and confirm them before final processing.

### Workflow

1.  **Upload**: Admin uploads a tray image to `uploads/{batchId}/original.jpg`.
2.  **Detection (Auto)**: `processCookieImage` function triggers.
    *   Calls Google Cloud Vision API (`objectLocalization`).
    *   Saves suggested bounding boxes to Firestore `cookie_batches/{batchId}`.
    *   Sets status to `review_required`.
3.  **Review (Manual)**: Admin reviews the suggestions in the UI.
    *   Adjusts, adds, or deletes bounding boxes.
4.  **Confirmation (Manual)**: Admin clicks "Confirm".
    *   UI calls `confirmCookieCrops` function with final crop coordinates.
5.  **Cropping (Auto)**: `confirmCookieCrops` function processes the image.
    *   Uses `sharp` to crop individual cookies.
    *   Uploads crops to `processed_cookies/{batchId}/{cookieId}.jpg`.
    *   Updates the `Category` document with the new cookie list.
    *   Sets status to `ready`.

## 2. Cloud Functions

### `processCookieImage`

**Trigger**: Storage Object Finalized (`onObjectFinalized`)
**Path**: `uploads/{batchId}/original.jpg`

**Logic**:
1.  Validates file path and content type.
2.  Creates/Updates `cookie_batches/{batchId}` with status `processing`.
3.  Downloads image and enhances contrast using `sharp` (normalization + linear adjustment).
4.  Sends enhanced image to Google Cloud Vision API.
5.  Extracts `normalizedVertices` (0-1 range) from `localizedObjectAnnotations`.
6.  Updates `cookie_batches/{batchId}`:
    *   `status`: `review_required`
    *   `detectedObjects`: Array of bounding boxes.
    *   `originalImageRef`: Path to the source image.

### `confirmCookieCrops`

**Trigger**: Callable Function (`onCall`)
**Input**: `{ batchId: string, crops: Array<{x, y, width, height}> }`

**Logic**:
1.  Verifies Admin authentication.
2.  Downloads the original image from `cookie_batches/{batchId}`.
3.  Iterates through the provided `crops` array (normalized coordinates).
4.  Converts normalized coordinates to pixel values.
5.  Uses `sharp` to extract (crop) the region.
6.  Uploads the cropped image to `processed_cookies/{batchId}/{cookieId}.jpg`.
7.  Makes the uploaded file public and gets the URL.
8.  Updates `events/{eventId}/categories/{categoryId}`:
    *   Sets the `cookies` array with `{ id, imageUrl }`.
9.  Updates `cookie_batches/{batchId}`:
    *   `status`: `ready`
    *   `totalCandidates`: Count of created cookies.

## 3. Data Model

### `cookie_batches/{batchId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | String | `processing`, `review_required`, `ready`, `error` |
| `createdAt` | Timestamp | When the upload started |
| `originalImageRef` | String | Storage path of the full tray image |
| `detectedObjects` | Array | List of AI-suggested bounding boxes |
| `eventId` | String | ID of the event this batch belongs to |
| `categoryId` | String | ID of the category this batch belongs to |
| `error` | String | Error message (if status is `error`) |

## 4. Configuration

- **Padding**: The system supports padding percentages (default 10%), but this logic is primarily handled during the review phase or can be adjusted in the function constants.
- **Image Enhancement**: The `processCookieImage` function applies contrast enhancement (`linear(1.1, ...)`) before sending to Vision API to improve detection of cookies against the tray.

## 5. Troubleshooting

- **No Objects Detected**: If Vision API returns 0 objects, the status is still set to `review_required` (with an empty list), allowing the admin to manually draw boxes.
- **"Missing eventId or categoryId"**: This error occurs if the `cookie_batches` document was not properly initialized with these fields before the image upload completed. The client is responsible for creating the batch document first.
