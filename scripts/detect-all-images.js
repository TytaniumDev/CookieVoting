/**
 * One-time script to run cookie detection on all existing images in shared/cookies/
 * This processes all images that were uploaded before auto-detection was implemented
 */

import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Try loading from root .env first, then functions/.env
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', 'functions', '.env') });

// Check if we're using emulators (check for explicit setting or if emulators are running)
const useEmulators =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.USE_EMULATORS === 'true';

if (useEmulators) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST =
    process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
  console.log('🔧 Using Firebase Emulators');
  console.log(`   Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`   Storage: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
} else {
  console.log('🌐 Using Production Firebase');
  console.log('   Note: Make sure you are authenticated with Firebase CLI: firebase login');
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_PROJECT_ID || 'cookie-voting',
  });
}

const db = admin.firestore();
const storage = admin.storage();
// Get bucket name from environment or use default
const bucketName = process.env.VITE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;
const bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();

// Get Gemini API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY or GEMINI_API_KEY_LOCAL environment variable is required');
  console.error('   Set it in your .env file or as an environment variable');
  process.exit(1);
}

/**
 * Detect cookies in an image using Gemini AI
 * (Copied from functions/src/index.ts)
 */
async function detectCookiesInImage(imageUrl, apiKey) {
  console.log(`[DetectCookies] Starting detection for image: ${imageUrl}`);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(apiKey);

  // Fetch the image
  let response;
  try {
    response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
  } catch (fetchError) {
    throw new Error(`Failed to fetch image: ${fetchError.message}`);
  }

  // Convert to base64
  const imageBuffer = await response.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  const imageMimeType = response.headers.get('content-type') || 'image/jpeg';

  // Use Gemini to detect cookies
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

  const prompt = `Analyze this image and identify all cookies. For each cookie you detect, provide:
1. The center position as a percentage (x, y) where (0,0) is top-left and (100,100) is bottom-right
2. The width and height as percentages of the image dimensions (for bounding box)
3. A polygon shape outlining the cookie's actual shape as an array of [x, y] coordinate pairs
   - Each point should be a percentage [x%, y%] where (0,0) is top-left and (100,100) is bottom-right
   - The polygon should have at least 4 points and follow the cookie's outline
   - Points should be ordered clockwise or counter-clockwise around the cookie
4. A confidence score from 0 to 1

Return the results as a JSON array of objects with this exact format:
[
  {
    "x": <center x percentage>,
    "y": <center y percentage>,
    "width": <width percentage>,
    "height": <height percentage>,
    "polygon": [[x1, y1], [x2, y2], [x3, y3], ...],
    "confidence": <confidence 0-1>
  }
]

The polygon should accurately outline the cookie's shape, not just a rectangle. Only include cookies that are clearly visible. If no cookies are found, return an empty array [].`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    },
  ]);

  const geminiResponse = await result.response;
  const responseText = geminiResponse.text() || '[]';

  // Parse JSON response
  let detectedCookies = [];
  try {
    const jsonMatch =
      responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
      responseText.match(/(\[[\s\S]*?\])/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;
    detectedCookies = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('[DetectCookies] Failed to parse Gemini response:', parseError);
    console.error('[DetectCookies] Response text:', responseText.substring(0, 500));
    return [];
  }

  // Validate and normalize results
  const validatedCookies = detectedCookies
    .filter((cookie, index) => {
      const isValid =
        typeof cookie.x === 'number' &&
        typeof cookie.y === 'number' &&
        typeof cookie.width === 'number' &&
        typeof cookie.height === 'number' &&
        cookie.x >= 0 &&
        cookie.x <= 100 &&
        cookie.y >= 0 &&
        cookie.y <= 100 &&
        cookie.width > 0 &&
        cookie.width <= 100 &&
        cookie.height > 0 &&
        cookie.height <= 100;
      if (!isValid) {
        console.warn(`[DetectCookies] Invalid cookie at index ${index}:`, cookie);
      }
      return isValid;
    })
    .map((cookie) => {
      // Validate and normalize polygon if present
      let polygon = undefined;
      if (cookie.polygon && Array.isArray(cookie.polygon)) {
        const filteredPolygon = cookie.polygon
          .filter(
            (point) =>
              Array.isArray(point) &&
              point.length === 2 &&
              typeof point[0] === 'number' &&
              typeof point[1] === 'number',
          )
          .map((point) => [
            Math.max(0, Math.min(100, point[0])),
            Math.max(0, Math.min(100, point[1])),
          ]);

        if (filteredPolygon.length >= 3) {
          polygon = filteredPolygon;
        }
      }

      return {
        x: Math.max(0, Math.min(100, cookie.x)),
        y: Math.max(0, Math.min(100, cookie.y)),
        width: Math.max(0.1, Math.min(100, cookie.width)),
        height: Math.max(0.1, Math.min(100, cookie.height)),
        polygon,
        confidence:
          typeof cookie.confidence === 'number' ? Math.max(0, Math.min(1, cookie.confidence)) : 0.8,
      };
    });

  return validatedCookies;
}

/**
 * Process all images in shared/cookies/ folder
 */
async function processAllImages() {
  console.log('🔍 Scanning for images in shared/cookies/...\n');

  try {
    // List all files in shared/cookies/
    const [files] = await bucket.getFiles({ prefix: 'shared/cookies/' });

    // Filter for image files
    const imageFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif')
      );
    });

    console.log(`📸 Found ${imageFiles.length} image file(s) to process\n`);

    if (imageFiles.length === 0) {
      console.log('✅ No images found. All done!');
      return;
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of imageFiles) {
      const filePath = file.name;
      console.log(`\n📄 Processing: ${filePath}`);

      try {
        // Check if detection already exists
        const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
        const detectionRef = db.collection('image_detections').doc(detectionDocId);
        const existingDoc = await detectionRef.get();

        if (existingDoc.exists()) {
          const existingData = existingDoc.data();
          if (existingData.detectedCookies && existingData.detectedCookies.length > 0) {
            console.log(
              `   ⏭️  Skipping (already has ${existingData.detectedCookies.length} detected cookies)`,
            );
            skipped++;
            continue;
          }
        }

        // Make file publicly accessible
        await file.makePublic();

        // Get download URL (use bucket name or construct from file metadata)
        const bucketName = bucket.name || process.env.VITE_STORAGE_BUCKET || 'default-bucket';
        const imageUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        // Detect cookies
        console.log(`   🔍 Detecting cookies...`);
        const detectedCookies = await detectCookiesInImage(imageUrl, apiKey);

        if (detectedCookies.length === 0) {
          console.log(`   ⚠️  No cookies detected`);
        } else {
          console.log(`   ✅ Detected ${detectedCookies.length} cookie(s)`);
        }

        // Store results in Firestore
        await detectionRef.set(
          {
            filePath,
            imageUrl,
            detectedCookies,
            count: detectedCookies.length,
            detectedAt: admin.firestore.FieldValue.serverTimestamp(),
            contentType: file.metadata.contentType || 'image/jpeg',
            processedBy: 'detect-all-images-script',
          },
          { merge: true },
        );

        console.log(`   💾 Saved detection results to Firestore`);
        processed++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ❌ Error processing ${filePath}:`, error.message);
        errors++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Done!`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
processAllImages()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
