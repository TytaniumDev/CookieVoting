# API Reference

This document details the backend API surfaces of the CookieVoting application, including Cloud Functions and the Firestore data model.

## Cloud Functions

All Cloud Functions are deployed to the `us-west1` region.

### 1. `processCookieImage` (Trigger)

**Trigger Type:** Cloud Storage (Object Finalized)
**Path:** `uploads/{batchId}/original.jpg`

Automatically processes uploaded images to detect cookies using the Google Cloud Vision API.

**Workflow:**
1.  Validates the file path and content type.
2.  Creates or updates a `cookie_batches` document with status `processing`.
3.  Enhances the image contrast using `sharp`.
4.  Calls Google Cloud Vision API (Object Localization).
5.  Saves detected bounding boxes to `cookie_batches/{batchId}`.
6.  Updates status to `review_required`.

### 2. `confirmCookieCrops` (Callable)

**Type:** HTTPS Callable
**Access:** Admin Only

Confirms and processes the final cookie crops after manual review.

**Request Payload:**
```json
{
  "batchId": "string (ID of the batch to process)",
  "crops": [
    {
      "x": "number (0-1, normalized X coordinate)",
      "y": "number (0-1, normalized Y coordinate)",
      "width": "number (0-1, normalized width)",
      "height": "number (0-1, normalized height)"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": "number (number of cookies cropped)"
}
```

**Actions:**
-   Downloads the original image from Cloud Storage.
-   Crops individual cookies using `sharp` based on the provided normalized coordinates.
-   Uploads cropped images to `processed_cookies/{batchId}/{cookieId}.jpg`.
-   Updates the corresponding `categories` document with the new cookie URLs.
-   Updates `cookie_batches` status to `ready`.

### 3. `addAdminRole` (Callable)

**Type:** HTTPS Callable
**Access:** Admin Only

Grants the `admin` custom claim to a user.

**Request Payload:**
```json
{
  "email": "string (Email of the user to promote)"
}
```

**Response:**
```json
{
  "result": "Success! {email} has been made an admin."
}
```

### 4. `removeAdminRole` (Callable)

**Type:** HTTPS Callable
**Access:** Admin Only

Revokes the `admin` custom claim from a user.

**Request Payload:**
```json
{
  "email": "string (Email of the user to demote)",
  "uid": "string (Optional: UID of the user)"
}
```

**Response:**
```json
{
  "result": "Success! Admin role removed."
}
```

## Firestore Schema

### Collection: `events`

Root collection for voting events.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique Event ID |
| `name` | String | Display name of the event |
| `status` | String | 'voting' \| 'completed' |
| `adminCode` | String | Code required for admin access |
| `resultsAvailableTime` | Timestamp | Time when results become public |

### Sub-collection: `events/{eventId}/categories`

Represents a grouping of cookies (e.g., a specific plate or tray).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Category ID |
| `name` | String | Category Name |
| `imageUrl` | String | URL to the tray image |
| `cookies` | Array | List of `Cookie` objects |

**Cookie Object Structure:**
```json
{
  "id": "string",
  "imageUrl": "string (URL to cropped image)",
  "bakerId": "string (optional)"
}
```

### Collection: `cookie_batches`

Temporary collection for managing the image processing workflow.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Batch ID (usually matches upload folder name) |
| `status` | String | 'processing' \| 'review_required' \| 'ready' \| 'error' |
| `eventId` | String | Linked Event ID |
| `categoryId` | String | Linked Category ID |
| `originalImageRef` | String | Storage path to original image |
| `detectedObjects` | Array | List of bounding boxes from Vision API |

### Collection: `votes`

Stores individual user votes.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | String | User ID (Anonymous or Auth) |
| `votes` | Map | Key: Category ID, Value: Array of Cookie IDs |
| `timestamp` | Timestamp | Time of vote submission |
