import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

// Version for extraction algorithm
const EXTRACTION_VERSION = '1.0';

/**
 * Extended DetectedCookie interface that includes extracted image URL
 */
interface ExtractedCookie {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<[number, number]>;
    confidence: number;
    extractedUrl?: string; // URL to the individually extracted cookie image
}

/**
 * Raw cookie data from Gemini segmentation response
 */
interface RawSegmentationCookie {
    box_2d?: [number, number, number, number]; // [y_min, x_min, y_max, x_max] normalized 0-1000
    label?: string;
    mask?: string; // base64 encoded PNG mask
    // Fallback to legacy format
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    polygon?: Array<[number, number]>;
    confidence?: number;
}

/**
 * Extracts individual cookie images from a source image using Gemini segmentation
 * and Sharp image processing.
 *
 * This function:
 * 1. Calls Gemini with a segmentation prompt to get bounding boxes and masks
 * 2. Uses Sharp to crop each cookie region
 * 3. Applies the mask (if available) to create transparent backgrounds
 * 4. Uploads each extracted cookie to Firebase Storage
 * 5. Returns cookie objects with URLs to the extracted images
 */
export const extractCookiesWithSegmentation = functionsV2.https.onCall(
    {
        region: 'us-west1',
        secrets: ['GEMINI_API_KEY'],
        timeoutSeconds: 300, // 5 minutes for processing multiple cookies
        memory: '1GiB', // Sharp needs more memory for image processing
    },
    async (request) => {
        console.log('[ExtractionStrategy] extractCookiesWithSegmentation called');

        // Verify authentication
        if (!request.auth) {
            throw new functionsV2.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to extract cookies',
            );
        }

        const { imageUrl, sourceFilePath } = request.data as {
            imageUrl: string;
            sourceFilePath?: string;
        };

        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new functionsV2.https.HttpsError(
                'invalid-argument',
                'imageUrl is required and must be a string',
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new functionsV2.https.HttpsError(
                'failed-precondition',
                'Gemini API key not configured',
            );
        }

        const db = admin.firestore();
        const bucket = admin.storage().bucket();

        // Extract base name from source file path for deterministic naming
        // e.g., "shared/cookies/my-image.jpg" -> "my-image"
        const sourceBaseName = sourceFilePath
            ? sourceFilePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown'
            : `url_${Date.now()}`;

        // Deterministic paths - reruns will overwrite
        const transparentPath = `shared/cookies/transparent/${sourceBaseName}.png`;
        const spritesPath = `shared/cookies/sprites/${sourceBaseName}`;

        console.log(`[ExtractionStrategy] Starting extraction for: ${sourceBaseName}`);

        try {
            // Step 1: Fetch the source image
            console.log('[ExtractionStrategy] Fetching source image...');
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const imageMimeType = response.headers.get('content-type') || 'image/jpeg';

            // Get image dimensions using sharp
            const imageMetadata = await sharp(imageBuffer).metadata();
            const imageWidth = imageMetadata.width || 1;
            const imageHeight = imageMetadata.height || 1;
            console.log(`[ExtractionStrategy] Image dimensions: ${imageWidth}x${imageHeight}`);

            // Step 2: Call Gemini for segmentation
            console.log('[ExtractionStrategy] Calling Gemini for segmentation...');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-exp', // Using 2.0 for native segmentation support
            });

            const segmentationPrompt = `Analyze this image and detect all cookies.
For each cookie, return:
1. box_2d: Bounding box as [y_min, x_min, y_max, x_max] in coordinates from 0-1000
2. label: A short description (e.g., "star cookie", "round cookie with frosting")

Return ONLY a JSON array in this exact format:
[
  { "box_2d": [y_min, x_min, y_max, x_max], "label": "description" }
]

IMPORTANT:
- Coordinates are normalized 0-1000 where 0 is top/left and 1000 is bottom/right
- Include ALL cookies visible in the image
- Make bounding boxes slightly larger than the cookie to ensure full capture
`;

            const result = await model.generateContent([
                segmentationPrompt,
                {
                    inlineData: {
                        mimeType: imageMimeType,
                        data: imageBuffer.toString('base64'),
                    },
                },
            ]);

            const responseText = result.response.text() || '[]';
            console.log('[ExtractionStrategy] Gemini response:', responseText.substring(0, 500));

            // Parse segmentation response
            let rawCookies: RawSegmentationCookie[] = [];
            try {
                // Extract JSON from response
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    rawCookies = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('[ExtractionStrategy] Failed to parse segmentation response:', parseError);
                throw new Error('Failed to parse Gemini response');
            }

            console.log(`[ExtractionStrategy] Found ${rawCookies.length} cookies to extract`);

            // Step 3: Ask Gemini to generate an image with cookies on transparent background in a GRID
            console.log('[ExtractionStrategy] Requesting Gemini to generate transparent cookie image with grid layout...');
            let geminiGeneratedImageBuffer: Buffer | null = null;
            let geminiImageUrl: string | null = null;

            try {
                // Use Nano Banana (Gemini 2.5 Flash Image) for better image generation capabilities
                const imageModel = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash-image',
                });

                // Calculate grid dimensions based on number of cookies
                const numCookies = rawCookies.length;
                const cols = Math.ceil(Math.sqrt(numCookies));
                const rows = Math.ceil(numCookies / cols);

                const imageGenPrompt = `Create a new image containing ONLY the cookies from the input image, placed on a transparent background.

CRITICAL LAYOUT INSTRUCTIONS:
1. Arrange the cookies in a STRICT GRID of ${rows} rows and ${cols} columns.
2. Example layout for ${numCookies} cookies:
   [ Cookie 1 ]   [ Cookie 2 ]   [ Cookie 3 ]
   [ Cookie 4 ]   [ Cookie 5 ]   [ Cookie 6 ]
3. Space the cookies far apart from each other. At least 50 pixels of empty space between every cookie.
4. Do NOT preserve the original positions. MOVE them into the grid.
5. Background must be 100% transparent.

Preserve the exact appearance of each cookie. Do not alter the cookies themselves, just move them into a clean grid.`;

                // Try to get Gemini to generate an edited image
                const imageResult = await imageModel.generateContent([
                    imageGenPrompt,
                    {
                        inlineData: {
                            mimeType: imageMimeType,
                            data: imageBuffer.toString('base64'),
                        },
                    },
                ]);

                // Check if response contains an image
                const candidates = imageResult.response.candidates;
                if (candidates && candidates.length > 0) {
                    const firstCandidate = candidates[0];
                    if (firstCandidate.content && firstCandidate.content.parts) {
                        for (const part of firstCandidate.content.parts) {
                            // Type assertion for inline data
                            const partWithData = part as { inlineData?: { mimeType: string; data: string } };
                            if (partWithData.inlineData && partWithData.inlineData.data) {
                                console.log('[ExtractionStrategy] Received image from Gemini');
                                geminiGeneratedImageBuffer = Buffer.from(partWithData.inlineData.data, 'base64');

                                // Upload the Gemini-generated transparent image (overwrites on rerun)
                                const debugFile = bucket.file(transparentPath);
                                await debugFile.save(geminiGeneratedImageBuffer, {
                                    metadata: { contentType: 'image/png' },
                                });
                                await debugFile.makePublic();
                                geminiImageUrl = `https://storage.googleapis.com/${bucket.name}/${transparentPath}`;
                                console.log(`[ExtractionStrategy] Saved transparent image: ${geminiImageUrl}`);
                                break;
                            }
                        }
                    }
                }

                if (!geminiGeneratedImageBuffer) {
                    console.log('[ExtractionStrategy] Gemini did not return an image, falling back to crop method');
                }
            } catch (imageGenError) {
                console.warn('[ExtractionStrategy] Gemini image generation failed, falling back to crop:', imageGenError);
            }

            // Step 4: Get NEW bounding boxes from the GENERATED image (not the original)
            let extractionCookies = rawCookies;

            if (geminiGeneratedImageBuffer) {
                console.log('[ExtractionStrategy] Running segmentation on generated transparent image...');
                try {
                    const segmentationResult = await model.generateContent([
                        `Analyze this image and detect all cookies. Return their bounding boxes.

For each cookie, return:
1. box_2d: Bounding box as [y_min, x_min, y_max, x_max] in coordinates from 0-1000
2. label: A short description

Return ONLY a JSON array in this exact format:
[
  { "box_2d": [y_min, x_min, y_max, x_max], "label": "description" }
]

IMPORTANT:
- Coordinates are normalized 0-1000 where 0 is top/left and 1000 is bottom/right
- Make bounding boxes slightly LOOSE around each cookie to ensure NO part of the cookie is cut off.
- It is better to include a bit of transparent background than to cut off a cookie edge.
- Include ALL cookies visible in the image`,
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: geminiGeneratedImageBuffer.toString('base64'),
                            },
                        },
                    ]);

                    const segText = segmentationResult.response.text() || '[]';
                    console.log('[ExtractionStrategy] Generated image segmentation:', segText.substring(0, 500));

                    const jsonMatch = segText.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        extractionCookies = JSON.parse(jsonMatch[0]);
                        console.log(`[ExtractionStrategy] Found ${extractionCookies.length} cookies in generated image`);
                    }
                } catch (segError) {
                    console.warn('[ExtractionStrategy] Failed to segment generated image, using original boxes:', segError);
                }
            }

            // Step 5: Extract each cookie using Sharp
            const extractedCookies: ExtractedCookie[] = [];

            // Use generated transparent image if available, otherwise fallback to original
            const sourceForExtraction = geminiGeneratedImageBuffer || imageBuffer;

            // Get the actual dimensions of the source we're extracting FROM
            const extractionMetadata = await sharp(sourceForExtraction).metadata();
            const extractWidth = extractionMetadata.width || imageWidth;
            const extractHeight = extractionMetadata.height || imageHeight;
            console.log(`[ExtractionStrategy] Extraction source dimensions: ${extractWidth}x${extractHeight}`);

            for (let i = 0; i < extractionCookies.length; i++) {
                const cookie = extractionCookies[i];
                const cookieId = `cookie_${i + 1}`;

                try {
                    let left: number, top: number, width: number, height: number;

                    if (cookie.box_2d && cookie.box_2d.length === 4) {
                        // Convert normalized coordinates (0-1000) to pixels using EXTRACTION source dimensions
                        const [yMin, xMin, yMax, xMax] = cookie.box_2d;
                        left = Math.floor((xMin / 1000) * extractWidth);
                        top = Math.floor((yMin / 1000) * extractHeight);
                        width = Math.floor(((xMax - xMin) / 1000) * extractWidth);
                        height = Math.floor(((yMax - yMin) / 1000) * extractHeight);
                    } else if (cookie.x !== undefined && cookie.y !== undefined) {
                        // Fallback to legacy format (percentage-based) - use extraction dimensions
                        const cookieWidth = cookie.width || 10;
                        const cookieHeight = cookie.height || 10;
                        left = Math.floor(((cookie.x - cookieWidth / 2) / 100) * extractWidth);
                        top = Math.floor(((cookie.y - cookieHeight / 2) / 100) * extractHeight);
                        width = Math.floor((cookieWidth / 100) * extractWidth);
                        height = Math.floor((cookieHeight / 100) * extractHeight);
                    } else {
                        console.warn(`[ExtractionStrategy] Cookie ${i} has no valid coordinates, skipping`);
                        continue;
                    }

                    // Ensure bounds are valid for EXTRACTION source dimensions
                    left = Math.max(0, left);
                    top = Math.max(0, top);
                    width = Math.min(width, extractWidth - left);
                    height = Math.min(height, extractHeight - top);

                    if (width <= 0 || height <= 0) {
                        console.warn(`[ExtractionStrategy] Cookie ${i} has invalid dimensions, skipping`);
                        continue;
                    }

                    console.log(`[ExtractionStrategy] Extracting cookie ${i + 1}: ${left},${top} ${width}x${height}`);

                    // Extract the cookie region (use Gemini-generated image if available, otherwise original)
                    const extractedBuffer = await sharp(sourceForExtraction)
                        .extract({ left, top, width, height })
                        .png() // Convert to PNG for transparency support
                        .toBuffer();

                    // Upload to Firebase Storage (overwrites on rerun)
                    const fileName = `${spritesPath}/${cookieId}.png`;
                    const file = bucket.file(fileName);
                    await file.save(extractedBuffer, {
                        metadata: { contentType: 'image/png' },
                    });
                    await file.makePublic();

                    const extractedUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                    // Calculate percentage-based coordinates for compatibility
                    const centerX = ((left + width / 2) / imageWidth) * 100;
                    const centerY = ((top + height / 2) / imageHeight) * 100;
                    const pctWidth = (width / imageWidth) * 100;
                    const pctHeight = (height / imageHeight) * 100;

                    extractedCookies.push({
                        id: cookieId,
                        x: centerX,
                        y: centerY,
                        width: pctWidth,
                        height: pctHeight,
                        confidence: 0.9,
                        extractedUrl,
                    });

                    console.log(`[ExtractionStrategy] Successfully extracted ${cookieId}: ${extractedUrl}`);
                } catch (extractError) {
                    console.error(`[ExtractionStrategy] Failed to extract cookie ${i}:`, extractError);
                }
            }

            // Step 5: Save extraction results to Firestore
            const detectionDocId = sourceFilePath
                ? sourceFilePath.replace(/\//g, '_').replace(/\./g, '_')
                : sourceBaseName;

            await db.collection('image_detections').doc(detectionDocId).set(
                {
                    filePath: sourceFilePath || imageUrl,
                    imageUrl,
                    // detectedCookies: extractedCookies, // Don't overwrite original detections
                    extractedCookies: extractedCookies, // Save specifically as extracted cookies
                    // count: extractedCookies.length, // Don't update main count
                    // detectedAt: admin.firestore.FieldValue.serverTimestamp(), // Don't update main timestamp
                    extractionCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
                    processedBy: 'extractCookiesWithSegmentation',
                    extractionVersion: EXTRACTION_VERSION,
                    transparentImagePath: transparentPath, // Path to transparent image
                    spritesPath: spritesPath, // Path to individual sprites
                    geminiGeneratedImageUrl: geminiImageUrl, // URL to Gemini-generated transparent image
                    status: 'completed',
                },
                { merge: true },
            );

            console.log(`[ExtractionStrategy] Extraction complete: ${extractedCookies.length} cookies`);

            return {
                cookies: extractedCookies,
                count: extractedCookies.length,
                transparentImagePath: transparentPath,
                spritesPath: spritesPath,
                geminiImageUrl,
            };
        } catch (error) {
            console.error('[ExtractionStrategy] Extraction failed:', error);
            throw new functionsV2.https.HttpsError(
                'internal',
                'Failed to extract cookies',
                error instanceof Error ? error.message : String(error),
            );
        }
    },
);
