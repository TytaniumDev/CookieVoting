# Technical Architecture & Deep Dive

> **Audience:** Developers, Architects, Contributors.
> **Scope:** Full-stack overview of the Cookie Voting application.

## 1. System Overview

Cookie Voting is a serverless application built on **Google Firebase**. It leverages **React 19** for the frontend and **Cloud Functions for Firebase** for backend logic. The core innovation is the **Assisted Cookie Detection Pipeline**, which uses Google Cloud Vision API to automate the identification of cookies in tray images.

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Zustand (State Management).
- **Backend**: Firebase Cloud Functions (Node.js 20).
- **Database**: Cloud Firestore (NoSQL).
- **Storage**: Cloud Storage for Firebase.
- **AI/ML**: Google Cloud Vision API (Production), Google Gemini (Experimental/Script only).
- **Auth**: Firebase Authentication (Anonymous for voters, Email/Password for admins).

---

## 2. Core Workflows

### 2.1 Assisted Cookie Detection Pipeline (The "Crop" Flow)

This is the most complex flow in the system, involving multiple cloud services.

1.  **Upload**: Admin uploads a tray image (containing multiple cookies) to the "Cookie Cropper" UI.
2.  **Trigger**: Image is saved to `uploads/{batchId}/original.jpg` in Storage.
3.  **Detection (Async)**:
    - `processCookieImage` Cloud Function is triggered.
    - It sends the image to **Google Cloud Vision API** (Object Localization).
    - Detected bounding boxes are saved to the `cookie_batches/{batchId}` document in Firestore under `detectedObjects`.
    - Batch status updates to `review_required`.
4.  **Review**: Admin sees the detected boxes on the original image in the UI. They can resize, add, or remove boxes.
5.  **Confirmation**:
    - Admin clicks "Confirm Crops".
    - UI calls the `confirmCookieCrops` Callable Function with the final coordinates.
6.  **Processing**:
    - The function uses `sharp` to physically crop the original image into individual cookie images.
    - Individual images are uploaded to `processed_cookies/{batchId}/{cookieId}.jpg`.
    - The `Category` document in Firestore is updated with the new cookie list.
    - Batch status updates to `ready`.

### 2.2 Voting Flow

1.  **Join**: User visits the event URL. An anonymous Firebase Auth session is established.
2.  **Vote**: User selects their favorite cookies. Votes are stored locally in the `UserVote` store.
3.  **Submit**: User submits votes. A `UserVote` document is created in `events/{eventId}/votes/{userId}`.
4.  **Results**: Real-time listeners on the `votes` collection aggregate results (client-side for small scale, or via potential future aggregation functions).

---

## 3. Data Model (Firestore)

### `events/{eventId}`
Stores the configuration for a voting event.
- `name`: String
- `status`: 'voting' | 'completed' | 'draft'
- `adminCode`: String (for simplified admin access, if used)

### `events/{eventId}/categories/{categoryId}`
Represents a "Tray" or category of cookies (e.g., "Most Creative").
- `name`: String
- `cookies`: Array of Objects
    - `id`: String (unique cookie ID)
    - `imageUrl`: String (public URL)
    - `baker`: String (optional)

### `events/{eventId}/votes/{userId}`
Stores a single user's votes to ensure one-vote-per-person per event.
- `votes`: Map<categoryId, cookieId>

### `cookie_batches/{batchId}`
Temporary state for the image processing pipeline.
- `status`: 'uploading' | 'processing' | 'review_required' | 'ready' | 'error'
- `originalImageRef`: String (Storage path)
- `detectedObjects`: Array of Objects (Vision API results)
    - `normalizedVertices`: Array of {x, y} (0-1 coordinates)
    - `confidence`: Number

---

## 4. Cloud Functions

Located in `functions/src/index.ts`.

| Function Name | Type | Purpose |
| :--- | :--- | :--- |
| `processCookieImage` | **Trigger** (Storage) | Listens for new uploads, calls Vision API, initializes batch data. |
| `confirmCookieCrops` | **Callable** (HTTPS) | Takes confirmed coordinates, crops images using `sharp`, updates the database. |
| `addAdminRole` | **Callable** (HTTPS) | Grants `admin: true` custom claim to a user (Admin only). |
| `removeAdminRole` | **Callable** (HTTPS) | Removes admin privileges. |

---

## 5. Security & Access Control

### Custom Claims
The system uses Firebase Custom Claims to designate admins.
- `token.admin === true`: Grants full read/write access to all collections and ability to invoke admin functions.

### Firestore Rules
- **Public Read**: Most data (`events`, `categories`, `cookies`) is readable by anyone (allow `read: if true`).
- **Admin Write**: strict `allow write: if isGlobalAdmin()` for core content.
- **Vote Write**: Open write access for `votes` collection (rate limiting/validation handled via app logic and potential future security rules enhancements).
- **Batch Isolation**: `cookie_batches` is largely managed by backend functions, with limited admin write access for status updates.

---

## 6. Experimental Features

### Gemini Script (`scripts/detect-all-images.js`)
An experimental utility script exists to batch-process images using **Google Gemini AI**. This is **NOT** part of the production pipeline and is intended for local testing or bulk backfilling of data in development environments. See `docs/GEMINI_SCRIPT_SETUP.md` for details.
