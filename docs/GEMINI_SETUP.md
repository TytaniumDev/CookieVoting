# Gemini Cookie Detection Setup

> **⚠️ NOTE: EXPERIMENTAL SCRIPT ONLY**
>
> This document applies **only** to the experimental utility script `scripts/detect-all-images.js`.
> The production application uses **Google Cloud Vision API** for cookie detection.
> See [`docs/VisionAPI.md`](./VisionAPI.md) for the production architecture.

This experimental script uses Google's Gemini AI to detect cookies in images. It runs locally as a Node.js script.

## Setup Instructions

### 1. Get a Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need it in the next step)

**Note:** The Gemini API has a generous free tier. For most use cases, you won't exceed the free limits.

### 2. Configure Environment

Create a `.env` file in the root directory (or use environment variables):

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Install Dependencies

Ensure you have the necessary dependencies installed in the root project:

```bash
npm install
```

### 4. Run the Script

You can run the detection script on all images in `shared/cookies/`:

```bash
node scripts/detect-all-images.js
```

## How It Works

1. **Script Execution**: The developer runs `scripts/detect-all-images.js` locally.
2. **Image Retrieval**: The script lists images from Firebase Storage (`shared/cookies/`).
3. **AI Analysis**: For each image, it sends a request to the Gemini API (`gemini-1.5-flash`) with a prompt to identify cookies and return bounding boxes.
4. **Data Storage**: The script writes the detected cookie data directly to the `image_detections` collection in Firestore.

## Security

- The API key is kept in your local `.env` file and is not committed to the repository.
- The script runs with your local Firebase Admin credentials (ensure you are logged in via `firebase login` or have service account credentials).

## API Costs

- **Free Tier**: Gemini API offers a generous free tier.
- **Pricing**: After free tier, costs are very low.
- **Model Used**: `gemini-1.5-flash` - optimized for speed and cost.
