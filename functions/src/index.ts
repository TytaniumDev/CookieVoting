import * as functionsV2 from 'firebase-functions/v2';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

// Detection function version - increment this when prompt/model changes
// This allows re-processing images when detection logic improves
const DETECTION_FUNCTION_VERSION = '3.1';

// The secret name for Gemini API key
// This secret must be created in Firebase Secret Manager
// Access it via process.env.GEMINI_API_KEY when the function runs

interface DetectedCookie {
  // Center point (for backward compatibility and point-based operations)
  x: number;
  y: number;
  // Bounding box (for backward compatibility)
  width: number;
  height: number;
  // Polygon shape as array of [x, y] points (percentages)
  // Each point is [x%, y%] where (0,0) is top-left and (100,100) is bottom-right
  polygon?: Array<[number, number]>;
  confidence: number;
}

/**
 * Detects cookies in an image using Gemini Vision API
 * Uses Firebase Secret Manager to securely store the Gemini API key
 */
export const detectCookiesWithGemini = functionsV2.https.onCall(
  {
    region: 'us-west1',
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 120, // Increased timeout for Gemini API calls (default is 60s)
  },
  async (request) => {
    console.log('[FirebaseFunction] detectCookiesWithGemini called');
    console.log(
      '[FirebaseFunction] Request auth:',
      request.auth ? `User: ${request.auth.uid}` : 'No auth',
    );

    // Verify authentication
    if (!request.auth) {
      console.error('[FirebaseFunction] Authentication failed - no auth object');
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to detect cookies',
      );
    }

    const { imageUrl } = request.data as { imageUrl: string };
    console.log('[FirebaseFunction] Extracted imageUrl:', imageUrl);

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('[FirebaseFunction] Invalid imageUrl:', imageUrl, typeof imageUrl);
      throw new functionsV2.https.HttpsError(
        'invalid-argument',
        'imageUrl is required and must be a string',
      );
    }

    // Get API key from secret
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;

    if (!apiKey) {
      console.error('[FirebaseFunction] Gemini API key not configured');
      throw new functionsV2.https.HttpsError(
        'failed-precondition',
        'Gemini API key not configured. Please set the GEMINI_API_KEY secret in Firebase Secret Manager.',
      );
    }

    const db = admin.firestore();
    const filePath = extractFilePathFromUrl(imageUrl);
    let detectionRef: admin.firestore.DocumentReference | null = null;

    // Initialize progress if possible
    if (filePath) {
      const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
      detectionRef = db.collection('image_detections').doc(detectionDocId);
      try {
        await detectionRef.set(
          {
            filePath,
            imageUrl,
            status: 'processing',
            progress: 'Initializing...',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (e) {
        console.warn('Failed to set initial progress:', e);
      }
    }

    try {
      console.log('[FirebaseFunction] Calling detectCookiesInImage with imageUrl:', imageUrl);

      // Update progress: Downloading
      if (detectionRef) {
        await detectionRef
          .set({ progress: 'Downloading image...' }, { merge: true })
          .catch(console.warn);
      }

      // Use the shared detection function
      // Note: We can't easily inject progress updates *inside* detectCookiesInImage without refactoring it to accept a callback
      // For now, we update before/after major steps
      const detectedCookies = await detectCookiesInImage(imageUrl, apiKey);

      // Update progress: Saving
      if (detectionRef) {
        await detectionRef
          .set({ progress: 'Finalizing results...' }, { merge: true })
          .catch(console.warn);
      }

      console.log(
        '[FirebaseFunction] Detection completed. Found',
        detectedCookies.length,
        'cookies',
      );

      // Save to Firestore 'image_detections' collection
      try {
        if (detectionRef) {
          console.log('[FirebaseFunction] Saving detections to Firestore');

          // Configure detected cookies for Firestore (convert nested arrays if needed)
          const firestoreCookies = detectedCookies.map((cookie) => ({
            x: cookie.x,
            y: cookie.y,
            width: cookie.width,
            height: cookie.height,
            confidence: cookie.confidence,
            polygon: cookie.polygon ? cookie.polygon.map(([x, y]) => ({ x, y })) : undefined,
          }));

          await detectionRef.set(
            {
              filePath,
              imageUrl,
              detectedCookies: firestoreCookies,
              count: detectedCookies.length,
              detectedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedBy: 'detectCookiesWithGemini-onCall',
              detectionVersion: DETECTION_FUNCTION_VERSION,
              status: 'completed',
              progress: 'Completed',
            },
            { merge: true },
          );
          console.log('[FirebaseFunction] Successfully saved detections');
        } else {
          console.warn(
            '[FirebaseFunction] Could not extract file path from URL, skipping Firestore save',
          );
        }
      } catch (saveError) {
        console.error('[FirebaseFunction] Error saving to Firestore:', saveError);
      }

      return {
        cookies: detectedCookies,
        count: detectedCookies.length,
      };
    } catch (error) {
      console.error('[FirebaseFunction] Error detecting cookies with Gemini:', error);

      // Update status to error
      if (detectionRef) {
        await detectionRef
          .set(
            {
              status: 'error',
              progress: 'Failed',
              error: error instanceof Error ? error.message : String(error),
            },
            { merge: true },
          )
          .catch(console.warn);
      }

      throw new functionsV2.https.HttpsError(
        'internal',
        'Failed to detect cookies',
        error instanceof Error ? error.message : String(error),
      );
    }
  },
);

/**
 * Extract file path from Firebase Storage download URL
 */
function extractFilePathFromUrl(imageUrl: string): string | null {
  try {
    // Try firebasestorage.googleapis.com format first (most specific)
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      const urlParts = imageUrl.split('/');
      const oIndex = urlParts.findIndex((part) => part === 'o');
      if (oIndex !== -1 && oIndex < urlParts.length - 1) {
        // Get the path after 'o' and before '?'
        const encodedPath = urlParts[oIndex + 1].split('?')[0];
        const filePath = decodeURIComponent(encodedPath);
        return filePath;
      }
    }

    // Try storage.googleapis.com format
    if (imageUrl.includes('storage.googleapis.com')) {
      const urlParts = imageUrl.split('storage.googleapis.com/');
      if (urlParts.length > 1) {
        const pathPart = urlParts[1].split('?')[0];
        return pathPart;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}

/**
 * Helper function to detect cookies in an image using Gemini
 * Extracted for reuse by both callable function and storage trigger
 */
async function detectCookiesInImage(imageUrl: string, apiKey: string): Promise<DetectedCookie[]> {
  console.log('[DetectCookies] Starting detection for image:', imageUrl);

  // Initialize Gemini AI with the API key
  console.log('[DetectCookies] Initializing GoogleGenerativeAI');
  const genAI = new GoogleGenerativeAI(apiKey);

  // Fetch the image
  console.log('[DetectCookies] Fetching image from URL:', imageUrl);
  let response: Response;
  try {
    response = await fetch(imageUrl);
    console.log('[DetectCookies] Fetch response status:', response.status, response.statusText);
    console.log(
      '[DetectCookies] Fetch response headers:',
      Object.fromEntries(response.headers.entries()),
    );
  } catch (fetchError) {
    console.error('[DetectCookies] Failed to fetch image:', fetchError);
    if (fetchError instanceof Error) {
      console.error('[DetectCookies] Fetch error details:', fetchError.message, fetchError.stack);
    }
    throw new Error(
      `Failed to fetch image: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
    );
  }

  if (!response.ok) {
    console.error(
      '[DetectCookies] Image fetch failed with status:',
      response.status,
      response.statusText,
    );
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  console.log('[DetectCookies] Converting image to base64');
  const imageBuffer = await response.arrayBuffer();
  console.log('[DetectCookies] Image buffer size:', imageBuffer.byteLength, 'bytes');
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  console.log('[DetectCookies] Base64 length:', imageBase64.length);
  const imageMimeType = response.headers.get('content-type') || 'image/jpeg';
  console.log('[DetectCookies] Detected MIME type:', imageMimeType);

  // Use Gemini to detect cookies with polygon shapes
  // Use gemini-3-flash-preview for best accuracy
  console.log('[DetectCookies] Getting Gemini model: gemini-3-flash-preview');
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });
  console.log('[DetectCookies] Successfully initialized gemini-3-flash-preview');

  const prompt = `Analyze this image and detect all cookies. Use a percentage-based coordinate system where (0,0) is top-left and (100,100) is bottom-right.

IMPORTANT CONTEXT - CHRISTMAS COOKIES:
These are decorated Christmas cookies that may have:
- UNUSUAL OR IRREGULAR SHAPES: Cookies may be cut into strange shapes (stars, trees, snowflakes, animals, etc.) - NOT just round circles
- HIGHLY DECORATED: Cookies may have extensive frosting, sprinkles, candies, or other decorative elements
- NON-STANDARD FORMS: Look for cookies of ANY shape - geometric, organic, or abstract forms
- Do NOT limit detection to round cookies - actively look for oddly shaped, decorated Christmas cookies
- A cookie is still a cookie even if it's shaped like a star, tree, or any other non-circular form

MENTAL GRID REFERENCE:
Imagine dividing the image into a 10x10 grid:
- Top-left region: x: 0-10, y: 0-10
- Top-center region: x: 45-55, y: 0-10
- Center region: x: 45-55, y: 45-55
- Bottom-right region: x: 90-100, y: 90-100

For each cookie (regardless of shape):
1. Identify which grid region(s) it occupies
2. Calculate precise percentages based on its position within those regions
3. The center (x, y) should reflect the cookie's actual center position
4. The polygon should trace the cookie's outer edge with 8-16 points (or more for complex shapes)

POLYGON SIZE GUIDANCE - CRITICAL:
- ERR ON THE SIDE OF MAKING THE POLYGON TOO LARGE rather than too small
- The polygon should fully encompass the ENTIRE cookie, including:
  * All decorative elements (frosting, sprinkles, candies)
  * Any protrusions or irregular edges
  * The full extent of the cookie shape, even if slightly irregular
- It's better to have a polygon that's 5-10% larger than needed than one that cuts off part of the cookie
- Think of the polygon as a "safety boundary" that should definitely include everything
- If unsure about the exact edge, extend the polygon slightly outward

COORDINATE ACCURACY:
- x: Percentage from LEFT edge (0 = leftmost, 100 = rightmost)
- y: Percentage from TOP edge (0 = topmost, 100 = bottommost)
- Center (x, y) should be the geometric center of the visible cookie
- Width and height represent the bounding box that would contain the cookie

POLYGON REQUIREMENTS:
- Use 8-16 points for round cookies, 12-20+ points for complex/irregular shapes (stars, trees, etc.)
- Points should trace the OUTERMOST visible edge of the cookie, following its actual shape
- For oddly shaped cookies (stars, trees, etc.), use more points to accurately capture points, corners, and curves
- Include any decorative elements that extend beyond the base cookie shape
- Order points clockwise or counter-clockwise around the cookie
- Make sure the polygon fully encloses the cookie - if in doubt, make it larger
- For non-circular shapes, the polygon should match the cookie's actual outline, not approximate it as a circle

VERIFICATION:
Before finalizing, check:
- Does the polygon fully cover the cookie? If not, expand it slightly
- Are all decorative elements (sprinkles, frosting edges) inside the polygon?
- Would the polygon still work if the cookie were slightly larger? If not, expand it
- Better to have extra space around the cookie than to cut off any part of it

Return JSON array only:
[
  {
    "x": <center x as percentage>,
    "y": <center y as percentage>,
    "width": <width as percentage>,
    "height": <height as percentage>,
    "polygon": [[x1, y1], [x2, y2], ...],
    "confidence": <0.0-1.0>
  }
]

Remember: It's better to make the polygon 10% too large than 1% too small. Ensure full cookie coverage.

DETECTION PRIORITY:
- Actively search for ALL cookies, including those with unusual shapes
- Do not skip oddly shaped cookies - they are still valid cookies
- Look for decorated Christmas cookies of any form: round, star-shaped, tree-shaped, or any other custom shape
- If you see a decorated cookie-like object with frosting or decorations, it's likely a cookie regardless of its shape`;

  console.log('[DetectCookies] Calling Gemini generateContent');
  let result;
  try {
    result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      },
    ]);
    console.log('[DetectCookies] Gemini API call completed');
  } catch (geminiError) {
    console.error('[DetectCookies] Gemini API call failed:', geminiError);
    if (geminiError instanceof Error) {
      console.error('[DetectCookies] Gemini error name:', geminiError.name);
      console.error('[DetectCookies] Gemini error message:', geminiError.message);
      console.error('[DetectCookies] Gemini error stack:', geminiError.stack);
    }
    throw geminiError;
  }

  console.log('[DetectCookies] Getting response from result');
  const geminiResponse = await result.response;
  console.log('[DetectCookies] Response obtained');
  const responseText = geminiResponse.text() || '[]';
  console.log('[DetectCookies] Response text length:', responseText.length);
  console.log(
    '[DetectCookies] Response text preview (first 500 chars):',
    responseText.substring(0, 500),
  );

  // Parse the JSON response
  let detectedCookies: unknown[] = [];
  try {
    console.log('[DetectCookies] Parsing JSON response');

    // Clean and extract JSON from response
    let jsonString = responseText.trim();

    // Remove markdown code blocks if present
    jsonString = jsonString
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to find JSON array in the text
    // First try: Look for array wrapped in markdown
    let jsonMatch = jsonString.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);

    // Second try: Look for array that starts with [ and ends with ]
    if (!jsonMatch) {
      const arrayStart = jsonString.indexOf('[');
      const arrayEnd = jsonString.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        jsonString = jsonString.substring(arrayStart, arrayEnd + 1);
        jsonMatch = [jsonString, jsonString];
      }
    } else {
      jsonString = jsonMatch[1];
    }

    // If still no match, try parsing the whole cleaned string
    if (!jsonMatch) {
      jsonString = responseText.trim();
    }

    console.log('[DetectCookies] Extracted JSON string length:', jsonString.length);
    console.log('[DetectCookies] Extracted JSON preview:', jsonString.substring(0, 500));

    // Parse JSON
    detectedCookies = JSON.parse(jsonString);

    // Validate it's an array
    if (!Array.isArray(detectedCookies)) {
      console.error('[DetectCookies] Parsed result is not an array:', typeof detectedCookies);
      detectedCookies = [];
    } else {
      console.log('[DetectCookies] Parsed', detectedCookies.length, 'cookies from response');
    }
  } catch (parseError) {
    console.error('[DetectCookies] Failed to parse Gemini response');
    console.error('[DetectCookies] Parse error:', parseError);
    if (parseError instanceof Error) {
      console.error('[DetectCookies] Parse error message:', parseError.message);
      console.error('[DetectCookies] Parse error stack:', parseError.stack);
    }
    console.error('[DetectCookies] Full response text:', responseText);
    console.error('[DetectCookies] Response text length:', responseText.length);

    // Try one more time with a more aggressive cleanup
    try {
      // Remove any text before first [ and after last ]
      const firstBracket = responseText.indexOf('[');
      const lastBracket = responseText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const cleanedJson = responseText.substring(firstBracket, lastBracket + 1);
        console.log('[DetectCookies] Attempting fallback parse with cleaned JSON');
        detectedCookies = JSON.parse(cleanedJson);
        if (!Array.isArray(detectedCookies)) {
          detectedCookies = [];
        } else {
          console.log(
            '[DetectCookies] Fallback parse succeeded:',
            detectedCookies.length,
            'cookies',
          );
        }
      } else {
        detectedCookies = [];
      }
    } catch (fallbackError) {
      console.error('[DetectCookies] Fallback parse also failed:', fallbackError);
      detectedCookies = [];
    }
  }

  console.log('[DetectCookies] Validating and normalizing', detectedCookies.length, 'cookies');

  // Validate that we have an array
  if (!Array.isArray(detectedCookies)) {
    console.error('[DetectCookies] Parsed result is not an array, got:', typeof detectedCookies);
    detectedCookies = [];
  }

  // Type for raw cookie data from API before validation
  interface RawCookieData {
    x?: unknown;
    y?: unknown;
    width?: unknown;
    height?: unknown;
    polygon?: unknown;
    confidence?: unknown;
    [key: string]: unknown;
  }

  // Validate and normalize the results
  const validatedCookies: DetectedCookie[] = detectedCookies
    .filter((cookie: RawCookieData, index: number) => {
      // Check if cookie is an object
      if (!cookie || typeof cookie !== 'object') {
        console.warn('[DetectCookies] Cookie at index', index, 'is not an object:', cookie);
        return false;
      }

      const isValid =
        typeof cookie.x === 'number' &&
        typeof cookie.y === 'number' &&
        typeof cookie.width === 'number' &&
        typeof cookie.height === 'number' &&
        !isNaN(cookie.x) &&
        !isNaN(cookie.y) &&
        !isNaN(cookie.width) &&
        !isNaN(cookie.height) &&
        cookie.x >= 0 &&
        cookie.x <= 100 &&
        cookie.y >= 0 &&
        cookie.y <= 100 &&
        cookie.width > 0 &&
        cookie.width <= 100 &&
        cookie.height > 0 &&
        cookie.height <= 100;
      if (!isValid) {
        console.warn('[DetectCookies] Invalid cookie at index', index, ':', JSON.stringify(cookie));
      }
      return isValid;
    })
    .map((cookie: RawCookieData, index: number) => {
      // Validate and normalize polygon if present
      let polygon: Array<[number, number]> | undefined = undefined;
      if (cookie.polygon) {
        if (!Array.isArray(cookie.polygon)) {
          console.warn(
            `[DetectCookies] Cookie ${index} has invalid polygon (not an array):`,
            typeof cookie.polygon,
          );
        } else {
          try {
            const filteredPolygon = (cookie.polygon as unknown[])
              .filter((point: unknown, pointIndex: number) => {
                const isValid =
                  Array.isArray(point) &&
                  point.length === 2 &&
                  typeof point[0] === 'number' &&
                  typeof point[1] === 'number' &&
                  !isNaN(point[0]) &&
                  !isNaN(point[1]);
                if (!isValid) {
                  console.warn(
                    `[DetectCookies] Cookie ${index} has invalid polygon point at index ${pointIndex}:`,
                    point,
                  );
                }
                return isValid;
              })
              .map(
                (point: [number, number]) =>
                  [Math.max(0, Math.min(100, point[0])), Math.max(0, Math.min(100, point[1]))] as [
                    number,
                    number,
                  ],
              );

            // Ensure polygon has at least 3 points
            if (filteredPolygon.length >= 3) {
              polygon = filteredPolygon;
            } else {
              console.warn(
                `[DetectCookies] Cookie ${index} polygon has insufficient points (${filteredPolygon.length}, need at least 3)`,
              );
            }
          } catch (polygonError) {
            console.error(
              `[DetectCookies] Error processing polygon for cookie ${index}:`,
              polygonError,
            );
          }
        }
      }

      return {
        x: Math.max(0, Math.min(100, cookie.x as number)),
        y: Math.max(0, Math.min(100, cookie.y as number)),
        width: Math.max(0.1, Math.min(100, cookie.width as number)),
        height: Math.max(0.1, Math.min(100, cookie.height as number)),
        polygon,
        confidence:
          typeof cookie.confidence === 'number' ? Math.max(0, Math.min(1, cookie.confidence)) : 0.8, // Default confidence if not provided
      };
    });

  console.log(
    '[DetectCookies] Validation complete. Returning',
    validatedCookies.length,
    'validated cookies',
  );
  return validatedCookies;
}

/**
 * Storage trigger that automatically detects cookies when an image is uploaded
 * Triggers on files uploaded to shared/cookies/ path
 */

/**
 * Background processing function - processes images asynchronously
 */
async function processImagesInBackground(jobId: string, apiKey: string) {
  const db = admin.firestore();
  const jobRef = db.collection('detection_jobs').doc(jobId);

  try {
    // Update job status to processing
    await jobRef.update({
      status: 'processing',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const bucket = admin.storage().bucket();

    // List all files in shared/cookies/
    console.log('[DetectAllImages] Listing files in shared/cookies/');
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

    console.log(`[DetectAllImages] Found ${imageFiles.length} image file(s) to process`);

    // Update job with total count
    await jobRef.update({
      total: imageFiles.length,
      processed: 0,
      skipped: 0,
      errors: 0,
    });

    // Process each image (no limit - process all)
    for (let i = 0; i < imageFiles.length; i++) {
      // Check if job was cancelled
      const jobSnapshot = await jobRef.get();
      const jobData = jobSnapshot.data();
      if (jobData?.status === 'cancelled') {
        console.log('[DetectAllImages] Job cancelled, stopping processing');
        await jobRef.update({
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const file = imageFiles[i];
      const filePath = file.name;
      console.log(`[DetectAllImages] Processing ${i + 1}/${imageFiles.length}: ${filePath}`);

      // Update progress
      await jobRef.update({
        currentFile: filePath,
        currentIndex: i + 1,
      });

      try {
        // Check if detection already exists
        const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
        const detectionRef = db.collection('image_detections').doc(detectionDocId);
        const existingDoc = await detectionRef.get();

        if (existingDoc.exists) {
          const existingData = existingDoc.data();
          const existingVersion = existingData?.detectionVersion;
          const hasCookies =
            existingData?.detectedCookies && existingData.detectedCookies.length > 0;

          // Skip if already processed with current version
          if (hasCookies && existingVersion === DETECTION_FUNCTION_VERSION) {
            console.log(
              `[DetectAllImages] Skipping ${filePath} (already processed with version ${DETECTION_FUNCTION_VERSION}, has ${existingData.detectedCookies.length} cookies)`,
            );
            await jobRef.update({
              skipped: admin.firestore.FieldValue.increment(1),
            });
            continue;
          } else if (hasCookies && existingVersion !== DETECTION_FUNCTION_VERSION) {
            console.log(
              `[DetectAllImages] Re-processing ${filePath} (version ${existingVersion || 'unknown'} -> ${DETECTION_FUNCTION_VERSION})`,
            );
          }
        }

        // Make file publicly accessible
        await file.makePublic();

        // Get download URL
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // Detect cookies
        console.log(`[DetectAllImages] Detecting cookies in ${filePath}`);
        const detectedCookies = await detectCookiesInImage(imageUrl, apiKey);

        // Store results in Firestore (convert polygons to Firestore-compatible format)
        // Firestore doesn't support nested arrays, so convert [[x,y], [x,y]] to [{x, y}, {x, y}]
        const firestoreCookies = detectedCookies.map((cookie) => ({
          x: cookie.x,
          y: cookie.y,
          width: cookie.width,
          height: cookie.height,
          confidence: cookie.confidence,
          polygon: cookie.polygon ? cookie.polygon.map(([x, y]) => ({ x, y })) : undefined,
        }));

        await detectionRef.set(
          {
            filePath,
            imageUrl,
            detectedCookies: firestoreCookies,
            count: detectedCookies.length,
            detectedAt: admin.firestore.FieldValue.serverTimestamp(),
            contentType: file.metadata.contentType || 'image/jpeg',
            processedBy: 'detectAllImages-function',
            detectionVersion: DETECTION_FUNCTION_VERSION,
          },
          { merge: true },
        );

        console.log(`[DetectAllImages] Processed ${filePath}: ${detectedCookies.length} cookies`);
        await jobRef.update({
          processed: admin.firestore.FieldValue.increment(1),
        });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[DetectAllImages] Error processing ${filePath}:`, error);
        await jobRef.update({
          errors: admin.firestore.FieldValue.increment(1),
        });
      }
    }

    // Check if job was cancelled before marking as completed
    const jobDoc = await jobRef.get();
    const finalJobData = jobDoc.data();
    if (finalJobData?.status === 'cancelled') {
      console.log('[DetectAllImages] Job was cancelled, not marking as completed');
      return;
    }

    // Mark job as completed
    await jobRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: finalJobData?.processed || 0,
      skipped: finalJobData?.skipped || 0,
      errors: finalJobData?.errors || 0,
    });

    console.log(
      `[DetectAllImages] Completed: ${finalJobData?.processed || 0} processed, ${finalJobData?.skipped || 0} skipped, ${finalJobData?.errors || 0} errors`,
    );
  } catch (error) {
    console.error('[DetectAllImages] Fatal error in background processing:', error);
    await jobRef.update({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Callable function to start async detection of all images
 * Returns immediately with a job ID, processing happens in background
 */
export const detectAllImages = functionsV2.https.onCall(
  {
    region: 'us-west1',
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 60, // Just need time to start the job
  },
  async (request) => {
    console.log('[FirebaseFunction] detectAllImages called');
    console.log(
      '[FirebaseFunction] Request auth:',
      request.auth ? `User: ${request.auth.uid}` : 'No auth',
    );

    // Verify authentication
    if (!request.auth) {
      console.error('[FirebaseFunction] Authentication failed - no auth object');
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to detect cookies',
      );
    }

    // Get API key from secret
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
    if (!apiKey) {
      console.error('[FirebaseFunction] Gemini API key not configured');
      throw new functionsV2.https.HttpsError(
        'failed-precondition',
        'Gemini API key not configured',
      );
    }

    const db = admin.firestore();

    // Check if there's already a running job
    const runningJobs = await db
      .collection('detection_jobs')
      .where('status', '==', 'processing')
      .limit(1)
      .get();

    if (!runningJobs.empty) {
      const existingJob = runningJobs.docs[0];
      return {
        jobId: existingJob.id,
        status: 'already_running',
        message: 'A detection job is already running. Check the job status for progress.',
      };
    }

    // Create a new job document
    const jobRef = db.collection('detection_jobs').doc();
    const jobId = jobRef.id;

    await jobRef.set({
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
    });

    // Job processing will be handled by the Firestore trigger (processDetectionJob)
    // This ensures reliable background processing that won't be terminated early
    // Return immediately with job ID
    return {
      jobId,
      status: 'queued',
      message:
        'Detection job queued. Processing will start shortly. Check job status for progress.',
    };
  },
);

/**
 * Cancel a running detection job
 */
export const cancelDetectionJob = functionsV2.https.onCall(
  {
    region: 'us-west1',
  },
  async (request) => {
    console.log('[FirebaseFunction] cancelDetectionJob called');

    // Verify authentication
    if (!request.auth) {
      console.error('[FirebaseFunction] Authentication failed - no auth object');
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to cancel jobs',
      );
    }

    const { jobId } = request.data as { jobId: string };

    if (!jobId || typeof jobId !== 'string') {
      throw new functionsV2.https.HttpsError('invalid-argument', 'jobId is required');
    }

    const db = admin.firestore();
    const jobRef = db.collection('detection_jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      throw new functionsV2.https.HttpsError('not-found', 'Job not found');
    }

    const jobData = jobDoc.data();
    const status = jobData?.status;

    // Only allow cancellation of queued or processing jobs
    if (status !== 'queued' && status !== 'processing') {
      throw new functionsV2.https.HttpsError(
        'failed-precondition',
        `Cannot cancel job with status: ${status}`,
      );
    }

    // Mark job as cancelled
    await jobRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: request.auth.uid,
    });

    console.log(`[FirebaseFunction] Job ${jobId} cancelled by ${request.auth.uid}`);

    return {
      success: true,
      message: 'Job cancelled successfully',
    };
  },
);

/**
 * Firestore trigger that processes detection jobs when they're created with status 'queued'
 * This ensures reliable background processing that won't be terminated early
 * The trigger runs in its own function instance, separate from the callable function
 */
export const processDetectionJob = onDocumentCreated(
  {
    document: 'detection_jobs/{jobId}',
    region: 'us-west1',
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 540, // Max supported timeout for Firestore triggers
  },
  async (event) => {
    const jobId = event.params.jobId;

    if (!event.data) {
      console.error(`[ProcessDetectionJob] No data for job: ${jobId}`);
      return;
    }

    const jobData = event.data.data();
    const jobRef = event.data.ref;

    console.log(`[ProcessDetectionJob] Triggered for job: ${jobId}`);
    console.log(`[ProcessDetectionJob] Job data:`, JSON.stringify(jobData));

    // Only process jobs with status 'queued'
    if (jobData?.status !== 'queued') {
      console.log(`[ProcessDetectionJob] Job ${jobId} status is '${jobData?.status}', skipping`);
      return;
    }

    // Check if there's already a processing job
    const db = admin.firestore();
    const runningJobs = await db
      .collection('detection_jobs')
      .where('status', '==', 'processing')
      .limit(1)
      .get();

    if (!runningJobs.empty && runningJobs.docs[0].id !== jobId) {
      console.log(`[ProcessDetectionJob] Another job is already processing, skipping job ${jobId}`);
      // Update this job to indicate it's waiting
      await jobRef.update({
        status: 'waiting',
        message: 'Another job is currently processing',
      });
      return;
    }

    // Get API key from secret
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
    if (!apiKey) {
      console.error('[ProcessDetectionJob] Gemini API key not configured');
      await jobRef.update({
        status: 'error',
        error: 'Gemini API key not configured',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // Process the job - this runs in its own function instance
    // The function won't terminate until this completes
    await processImagesInBackground(jobId, apiKey);

    console.log(`[ProcessDetectionJob] Completed processing job: ${jobId}`);
  },
);

export const autoDetectCookiesOnUpload = onObjectFinalized(
  {
    region: 'us-west1',
    secrets: ['GEMINI_API_KEY'],
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Only process images in the shared/cookies/ folder
    if (!filePath.startsWith('shared/cookies/')) {
      console.log(`Skipping file outside shared/cookies/: ${filePath}`);
      return;
    }

    // Only process image files
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`Skipping non-image file: ${filePath}`);
      return;
    }

    console.log(`Processing image upload: ${filePath}`);

    try {
      // Get API key from secret
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
      if (!apiKey) {
        console.error('Gemini API key not configured');
        return;
      }

      // Get download URL for the uploaded file
      const bucket = admin.storage().bucket(event.data.bucket);
      const file = bucket.file(filePath);
      await file.makePublic(); // Ensure file is publicly accessible
      const imageUrl = `https://storage.googleapis.com/${event.data.bucket}/${filePath}`;

      // Detect cookies in the image
      const detectedCookies = await detectCookiesInImage(imageUrl, apiKey);

      console.log(`Detected ${detectedCookies.length} cookies in ${filePath}`);

      // Store detection results in Firestore
      // Use a hash of the file path as the document ID to avoid duplicates
      const db = admin.firestore();
      const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
      const detectionRef = db.collection('image_detections').doc(detectionDocId);

      // Check if detection already exists with current version
      const existingDoc = await detectionRef.get();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        const existingVersion = existingData?.detectionVersion;
        const hasCookies = existingData?.detectedCookies && existingData.detectedCookies.length > 0;

        if (hasCookies && existingVersion === DETECTION_FUNCTION_VERSION) {
          console.log(
            `Skipping detection for ${filePath} (already processed with version ${DETECTION_FUNCTION_VERSION})`,
          );
          return;
        } else if (hasCookies && existingVersion !== DETECTION_FUNCTION_VERSION) {
          console.log(
            `Re-processing ${filePath} (version ${existingVersion || 'unknown'} -> ${DETECTION_FUNCTION_VERSION})`,
          );
        }
      }

      // Convert polygons to Firestore-compatible format (nested arrays not supported)
      const firestoreCookies = detectedCookies.map((cookie) => ({
        x: cookie.x,
        y: cookie.y,
        width: cookie.width,
        height: cookie.height,
        confidence: cookie.confidence,
        polygon: cookie.polygon ? cookie.polygon.map(([x, y]) => ({ x, y })) : undefined,
      }));

      await detectionRef.set(
        {
          filePath,
          imageUrl,
          detectedCookies: firestoreCookies,
          count: detectedCookies.length,
          detectedAt: admin.firestore.FieldValue.serverTimestamp(),
          contentType,
          processedBy: 'autoDetectCookiesOnUpload',
          detectionVersion: DETECTION_FUNCTION_VERSION,
        },
        { merge: true },
      );

      console.log(`Stored detection results for ${filePath}`);
    } catch (error) {
      console.error(`Error auto-detecting cookies for ${filePath}:`, error);
      // Don't throw - we don't want to fail the upload if detection fails
    }
  },
);

/**
 * Add admin role to a user
 * Only callable by existing admins
 */
export const addAdminRole = functionsV2.https.onCall(
  {
    region: 'us-west1',
  },
  async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to add admins.',
      );
    }

    // Check if user is an admin
    if (request.auth.token.admin !== true) {
      throw new functionsV2.https.HttpsError(
        'permission-denied',
        'Only admins can add other admins.',
      );
    }

    const { email } = request.data;

    if (!email || typeof email !== 'string') {
      throw new functionsV2.https.HttpsError('invalid-argument', 'Email is required.');
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      return {
        result: `Success! ${email} has been made an admin.`,
      };
    } catch (error) {
      console.error('Error adding admin:', error);
      throw new functionsV2.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Error adding admin role',
      );
    }
  },
);

/**
 * Remove admin role from a user
 * Only callable by existing admins
 */
export const removeAdminRole = functionsV2.https.onCall(
  {
    region: 'us-west1',
  },
  async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to remove admins.',
      );
    }

    // Check if user is an admin
    if (request.auth.token.admin !== true) {
      throw new functionsV2.https.HttpsError(
        'permission-denied',
        'Only admins can remove other admins.',
      );
    }

    const { email, uid } = request.data;

    if (!email && !uid) {
      throw new functionsV2.https.HttpsError('invalid-argument', 'Email or UID is required.');
    }

    try {
      let user;
      if (uid) {
        user = await admin.auth().getUser(uid);
      } else {
        user = await admin.auth().getUserByEmail(email);
      }

      // Prevent removing self (basic check)
      if (user.uid === request.auth.uid) {
        throw new functionsV2.https.HttpsError(
          'invalid-argument',
          'You cannot remove your own admin status.',
        );
      }

      await admin.auth().setCustomUserClaims(user.uid, { admin: false });
      return {
        result: `Success! Admin role removed.`,
      };
    } catch (error) {
      console.error('Error removing admin:', error);
      throw new functionsV2.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Error removing admin role',
      );
    }
  },
);

// Only export this function in the emulator environment
// This prevents deployment errors in production (requires GCIP) while keeping it for local dev
export const autoGrantAdmin =
  process.env.FUNCTIONS_EMULATOR === 'true'
    ? beforeUserCreated({ region: 'us-west1' }, async (event) => {
        console.log(
          `[Emulator] Auto-granting admin to new user: ${event.data?.email || 'no-email'} (${event.data?.uid})`,
        );
        return {
          customClaims: {
            admin: true,
          },
        };
      })
    : undefined;
