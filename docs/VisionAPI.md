# Vision API & Cookie Pipeline

> **Role:** Technical Implementation Details
> **Context:** See [`ARCHITECTURE_TECHNICAL.md`](./ARCHITECTURE_TECHNICAL.md) for the full system overview.

This document details the **Assisted Cookie Detection Pipeline**, specifically focusing on the interaction between Firebase Cloud Functions and the Google Cloud Vision API.

## 1. Overview

The pipeline automates the difficult task of isolating individual cookies from a group photo ("Tray"). Instead of manual cropping, we use AI to detect objects and suggest crops, which an admin then reviews and confirms.

**Key Technology:**
- **Google Cloud Vision API**: Service: `objectLocalization`. Returns bounding polygons for detected objects.
- **Sharp (Node.js)**: High-performance image processing library used for contrast enhancement (pre-detection) and final cropping.

## 2. Implementation: The Two-Step Process

Unlike a simple "Magic Resize" tool, this pipeline is asynchronous and stateful.

### Step 1: Detection (The Trigger)
**Function:** `processCookieImage` (in `functions/src/index.ts`)
**Trigger:** `storage.object().onFinalize` (Upload to `uploads/{batchId}/original.jpg`)

**Logic:**
1.  **Validation**: Checks if the file is an image and in the correct path.
2.  **Preprocessing**:
    - Downloads the image to a temp file.
    - Uses `sharp` to **normalize** and **enhance contrast** (linear increase). This significantly improves Vision API detection rates on cookie trays.
3.  **Vision API Call**:
    - Sends the *enhanced* image to `visionClient.objectLocalization()`.
    - Receives a list of `localizedObjectAnnotations` (candidates).
4.  **State Update**:
    - Writes the raw candidates to `cookie_batches/{batchId}` in the `detectedObjects` field.
    - Sets `status: 'review_required'`.
    - **Note:** No cropping happens here. We trust the AI to *find* objects, but not to *cut* them perfectly without human review.

### Step 2: Confirmation (The Action)
**Function:** `confirmCookieCrops` (in `functions/src/index.ts`)
**Trigger:** HTTPS Callable (Admin UI)

**Logic:**
1.  **Input**: Receives `batchId` and a list of `crops` (finalized coordinates).
2.  **Processing**:
    - Downloads the *original* (un-enhanced) image.
    - Iterates through the `crops` list.
    - Uses `sharp` to extract the specific region (converting normalized 0-1 coords to pixels).
    - Uploads the resulting image to `processed_cookies/{batchId}/{cookieId}.jpg`.
3.  **Completion**:
    - Updates the target `Category` document with the new cookie URLs.
    - Updates `cookie_batches/{batchId}` status to `ready`.

## 3. Data Structure

### Batch Document (`cookie_batches/{batchId}`)

The `detectedObjects` array contains the raw output from Vision API, simplified for the frontend:

```typescript
interface DetectedObject {
  // Normalized coordinates (0 to 1) relative to image dimensions
  normalizedVertices: [
    { x: 0.1, y: 0.1 }, // Top-Left
    { x: 0.2, y: 0.1 }, // Top-Right
    // ...
  ];
  confidence: number; // 0.0 to 1.0
}
```

## 4. Why this approach?

1.  **Accuracy vs. Speed**: We prioritize accuracy. Vision API is good, but "Cookie vs. Brownie" is hard. Human review ensures 100% quality.
2.  **Cost Efficiency**: We call the API once per tray, not once per cookie.
3.  **Preprocessing**: Real-world photos are often poorly lit. Enhancing contrast *before* sending to AI proved critical during testing.

## 5. Troubleshooting

-   **"No objects detected"**:
    -   Check if the image is too dark.
    -   Ensure `GOOGLE_APPLICATION_CREDENTIALS` (or default identity) has "Cloud Vision API User" role.
    -   Check logs for "Vision API detected 0 objects".
-   **"Crops are misaligned"**:
    -   The frontend canvas and the backend `sharp` logic must agree on coordinate space (normalized 0-1 is safest).
