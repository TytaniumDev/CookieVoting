# Gemini Cookie Detection Setup

This project uses Google's Gemini AI to detect cookies in images. The detection runs through Firebase Functions for security and reliability.

## Setup Instructions

### 1. Get a Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need it in the next step)

**Note:** The Gemini API has a generous free tier. For most use cases, you won't exceed the free limits.

### 2. Configure Firebase Secret Manager (Production)

The API key is stored securely in Firebase Secret Manager. Set it up using the Firebase CLI:

```bash
# Create the secret in Firebase Secret Manager
firebase functions:secrets:set GEMINI_API_KEY

# When prompted, paste your API key and press Enter
# The secret will be stored securely in Google Cloud Secret Manager
```

**Note:** You need to have the Secret Manager API enabled in your Google Cloud project. If you get an error, enable it with:
```bash
gcloud services enable secretmanager.googleapis.com
```

### 3. Configure for Local Development

For local emulator testing, create a `.env` file in the `functions` directory:

```bash
# Use a different variable name to avoid conflicts during deployment
GEMINI_API_KEY_LOCAL=your_api_key_here
```

**Important:** Use `GEMINI_API_KEY_LOCAL` (not `GEMINI_API_KEY`) in your `.env` file to avoid conflicts with the secret during deployment. The emulator will use this environment variable as a fallback when the secret isn't available.

### 4. Install Dependencies

Install the Firebase Functions dependencies:

```bash
cd functions
npm install
cd ..
```

### 5. Test Locally with Emulators

Start the Firebase emulators (including Functions):

```bash
npm run emulators:start
```

Or start with seed data:

```bash
npm run emulators:start:seed
```

The Functions emulator will run on port 5001. Make sure you have:
1. Created a `.env` file in the `functions` directory with your `GEMINI_API_KEY`
2. Built the functions: `npm run build --prefix functions`

### 6. Deploy to Production

When ready to deploy:

```bash
# Build the functions
npm run build --prefix functions

# Deploy functions
firebase deploy --only functions
```

## How It Works

1. **Client-side**: When a user clicks "Auto-detect Cookies", the app calls the Firebase Function `detectCookiesWithGemini`
2. **Firebase Function**: The function:
   - Retrieves the Gemini API key from Firebase Secret Manager (or `.env` file for local emulator)
   - Fetches the image from Firebase Storage
   - Sends it to Gemini AI with a prompt to detect cookies
   - Parses the JSON response with cookie positions
   - Returns the detected cookies to the client
3. **Client-side**: The app displays the detected cookies and allows the user to confirm or edit them

## Security

The Gemini API key is stored securely in Firebase Secret Manager, which:
- Encrypts secrets at rest
- Provides access control and audit logging
- Automatically rotates secrets if configured
- Never exposes secrets in function logs or code

The function automatically has access to the secret when deployed, as long as the secret exists in Secret Manager.

## API Costs

- **Free Tier**: Gemini API offers a generous free tier
- **Pricing**: After free tier, costs are very low (typically $0.0001-0.001 per image)
- **Model Used**: `gemini-1.5-flash` - optimized for speed and cost

## Troubleshooting

### "Gemini API key not configured" Error

Make sure you've set the API key using one of the methods above. Check:
- **For local emulator**: Environment variable `GEMINI_API_KEY_LOCAL` is set in `functions/.env` file
- **For production**: Secret `GEMINI_API_KEY` is set in Firebase Secret Manager using `firebase functions:secrets:set GEMINI_API_KEY`

**Note:** If you get a deployment error about "Secret environment variable overlaps non secret environment variable", make sure your `functions/.env` file uses `GEMINI_API_KEY_LOCAL` (not `GEMINI_API_KEY`).

### "Cookie detection service is not available" Error

This means the Firebase Function hasn't been deployed. Deploy it with:
```bash
firebase deploy --only functions
```

### Functions Not Working in Emulator

Make sure:
1. Functions emulator is running (check port 5001) - it's included in `npm run emulators:start`
2. You've installed dependencies: `cd functions && npm install`
3. Functions are built: `npm run build --prefix functions`
4. You've created a `.env` file in the `functions` directory with `GEMINI_API_KEY=your_key_here`
5. The client is configured to use emulators: Set `VITE_USE_EMULATOR=true` in your root `.env` file

## Alternative: Using the Firebase Extension

If you prefer using the "Multimodal Tasks with the Gemini API" extension you installed:

1. The extension works differently - it monitors Firestore documents
2. You'd need to restructure the workflow to:
   - Upload image to Storage
   - Create a Firestore document with the image URL
   - Extension processes it automatically
   - Read results from Firestore

The current implementation (Firebase Functions) is more flexible and fits the existing workflow better.

