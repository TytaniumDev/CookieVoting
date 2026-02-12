# System Architecture

## 🏗️ High-Level Overview

Cookie Voting is a modern, serverless web application built for real-time interaction and AI-powered content processing.

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS (Hosted on Firebase Hosting)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **AI**: Google Cloud Vision API (for object detection)

## 🍪 Cookie Detection Pipeline

One of the core features is the automated detection of individual cookies from a tray image. The pipeline follows a **Detect-Review-Crop** workflow:

1.  **Upload**: Admin uploads an image to `uploads/{batchId}/original.jpg`.
2.  **Trigger**: Cloud Function `processCookieImage` is triggered by the storage event.
3.  **Detect**: The function calls **Google Cloud Vision API** to detect objects (cookies) in the image.
4.  **Review**: The system stores detected bounding boxes in Firestore (`cookie_batches/{batchId}`). The status is set to `review_required`.
5.  **Admin Review**: An admin reviews the bounding boxes in the UI, adjusting them if necessary.
6.  **Confirm & Crop**: The admin confirms the batch. Cloud Function `confirmCookieCrops` uses **Sharp** to crop the individual cookies and save them to Storage.
7.  **Publish**: The individual cookie images are linked to the `Category` in Firestore and become available for voting.

For more details on the Vision API integration, see [Vision API Integration Plan](./docs/VISION_API_INTEGRATION_PLAN.md).

## 🗄️ Data Model

The application uses Firestore for its NoSQL database.

- **Events**: The root collection for voting events.
  - **Categories**: Sub-collection for cookie categories (e.g., "Best Taste", "Best Decoration").
- **Cookie Batches**: Temporary collection for managing image processing and cropping workflow.
- **Votes**: Collection storing individual user votes.

For the detailed schema and API reference, see [API Documentation](./API.md).

## 🔐 Security

- **Authentication**: Firebase Authentication (Email/Password, Google).
- **Authorization**: Custom Claims (`admin: true`) control access to the admin dashboard and sensitive Cloud Functions.
- **Rules**: Firestore Security Rules enforce data validation and ownership.

For more details on product requirements, see [PRD](./docs/PRD.md).
