# Vision API Integration Details

> **Note**: For a high-level overview of the Cookie Detection Pipeline, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Overview

This document details the specific implementation of the Google Cloud Vision API for cookie detection.

## Implementation

### 1. Detection (Cloud Vision API)
The `processCookieImage` Cloud Function utilizes the `ImageAnnotatorClient` from `@google-cloud/vision`.

-   **Method**: `objectLocalization`
-   **Input**: Enhanced image (contrast boosted with `sharp`).
-   **Output**: Bounding Poly vertices (normalized 0-1).
-   **Confidence Threshold**: All objects are returned; filtering happens if needed, but currently all detections are saved for review.

### 2. Data Structures

#### Batch Status (`cookie_batches/{batchId}`)
The batch document tracks the lifecycle of an image processing request.

-   `status`:
    -   `uploading`: Initial state.
    -   `processing`: Cloud Function is running.
    -   `review_required`: Detection complete, waiting for admin.
    -   `ready`: Cropping complete, cookies available in Category.
    -   `error`: Something went wrong.

#### Detected Objects
Stored in `cookie_batches/{batchId}` as `detectedObjects` array.

```typescript
interface DetectedObject {
  normalizedVertices: { x: number, y: number }[];
  confidence: number;
}
```

### 3. Cropping Strategy
Cropping is **not** performed automatically by the Vision API response. It is a separate step (`confirmCookieCrops`) triggered by the admin.

-   **Reasoning**: AI detection is not perfect. A "Human-in-the-Loop" review step ensures that only valid cookies are presented to voters.
-   **Mechanism**: The frontend sends the *final* approved crop coordinates (which may differ from the AI suggestions) to the backend. The backend uses `sharp` to extract these regions.

## Configuration

-   **Padding**: A padding percentage (default 10%) is applied during the *manual review* or *cropping* phase to ensuring the cookie isn't cut off.
-   **Environment**: Requires `@google-cloud/vision` package in `functions/package.json`.
