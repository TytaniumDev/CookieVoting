import * as functionsV2 from 'firebase-functions/v2';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

admin.initializeApp();

// Configuration constants
const TARGET_COLLECTION = 'cookie_batches';
const DEFAULT_PADDING_PERCENTAGE = 0.1; // 10% default padding
const MIN_PADDING = 0.0;
const MAX_PADDING = 0.5;

/**
 * Process cookie image when uploaded to uploads/{batchId}/original.jpg
 * Uses Vision API to detect cookies and Sharp to crop them
 */
export const processCookieImage = onObjectFinalized(
  {
    region: 'us-west1',
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const bucket = admin.storage().bucket(event.data.bucket);

    // Only process images in the uploads/{batchId}/ path
    if (!filePath.startsWith('uploads/') || !filePath.endsWith('/original.jpg')) {
      console.log(`Skipping file outside uploads/{batchId}/original.jpg pattern: ${filePath}`);
      return;
    }

    // Only process image files
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`Skipping non-image file: ${filePath}`);
      return;
    }

    // Extract batchId from path: uploads/{batchId}/original.jpg
    const pathParts = filePath.split('/');
    if (pathParts.length !== 3 || pathParts[0] !== 'uploads' || pathParts[2] !== 'original.jpg') {
      console.log(`Invalid file path format: ${filePath}`);
      return;
    }
    const batchId = pathParts[1];

    console.log(`Processing cookie image upload: ${filePath} (batchId: ${batchId})`);

    const db = admin.firestore();
    const batchRef = db.collection(TARGET_COLLECTION).doc(batchId);
    const tempFilePath = path.join(os.tmpdir(), `cookie-image-${batchId}.jpg`);
    const visionClient = new ImageAnnotatorClient();

    try {
      // Initialize batch status if not exists
      const batchDoc = await batchRef.get();
      if (!batchDoc.exists) {
        await batchRef.set({
          status: 'processing',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          originalImageRef: filePath,
          paddingPercentage: DEFAULT_PADDING_PERCENTAGE,
        });
      } else {
        // Update status to processing
        await batchRef.update({
          status: 'processing',
          originalImageRef: filePath,
        });
      }

      // Get batch data including eventId and categoryId
      const batchData = (await batchRef.get()).data();
      const eventId = batchData?.eventId;
      const categoryId = batchData?.categoryId;
      let paddingPercentage = batchData?.paddingPercentage ?? DEFAULT_PADDING_PERCENTAGE;

      // Validate eventId and categoryId
      if (!eventId || !categoryId) {
        console.error(
          `Missing eventId or categoryId in batch ${batchId}. Cannot write to Category.`,
        );
        await batchRef.update({
          status: 'error',
          error: 'Missing eventId or categoryId',
        });
        return;
      }

      // Validate padding is within range
      if (
        typeof paddingPercentage !== 'number' ||
        paddingPercentage < MIN_PADDING ||
        paddingPercentage > MAX_PADDING
      ) {
        console.warn(
          `Invalid paddingPercentage ${paddingPercentage}, using default ${DEFAULT_PADDING_PERCENTAGE}`,
        );
        paddingPercentage = DEFAULT_PADDING_PERCENTAGE;
      }

      // Download image to temp directory
      const file = bucket.file(filePath);
      await file.download({ destination: tempFilePath });

      // Pre-process image for better detection (high contrast)
      const enhancedTempFilePath = path.join(os.tmpdir(), `enhanced-${batchId}.jpg`);
      console.log(`Pre-processing image for Vision API: ${enhancedTempFilePath}`);

      // Normalize and slightly increase contrast
      await sharp(tempFilePath)
        // Normalize: expand the full dynamic range
        .normalize()
        // Increase contrast slightly (1.0 is original, >1.0 is higher)
        .linear(1.1, -(128 * 1.1) + 128)
        .toFile(enhancedTempFilePath);

      // Call Vision API objectLocalization with ENHANCED image
      console.log(`Calling Vision API for ${filePath}`);
      // @ts-expect-error - objectLocalization exists but TypeScript types may not be fully accurate
      const [result] = await visionClient.objectLocalization(enhancedTempFilePath);

      // Clean up enhanced image immediately
      await fs
        .remove(enhancedTempFilePath)
        .catch((e) => console.warn('Failed to cleanup enhanced image:', e));

      const objects = result.localizedObjectAnnotations || [];
      console.log(`Vision API detected ${objects.length} objects`);

      if (objects.length === 0) {
        // Even if 0 objects, we set to review_required so user can manually add boxes
        // We write an empty array of detectedObjects
      }

      // Collect detected objects to save for review
      const detectedObjects: Array<{
        normalizedVertices: Array<{ x?: number | null; y?: number | null }>;
        confidence: number;
      }> = [];

      for (const obj of objects) {
        if (
          !obj.boundingPoly ||
          !obj.boundingPoly.normalizedVertices ||
          obj.boundingPoly.normalizedVertices.length < 2
        ) {
          continue;
        }
        detectedObjects.push({
          normalizedVertices: obj.boundingPoly.normalizedVertices,
          confidence: obj.score || 0,
        });
      }

      // Update batch status to review_required and save detected objects
      await batchRef.update({
        status: 'review_required',
        detectedObjects,
        originalImageRef: filePath,
        // We don't save cookies to Category yet
      });

      console.log(
        `Batch ${batchId} set to review_required with ${detectedObjects.length} detected objects`,
      );

      // Clean up temp files
      await fs.remove(tempFilePath).catch((e) => console.warn('Failed to cleanup temp file:', e));
    } catch (error) {
      console.error(`Error processing cookie image ${filePath}:`, error);
      await batchRef.update({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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

/**
 * Confirm and process cookie crops
 * Input: batchId, crops (array of {x, y, width, height}) - in normalized coordinates (0-1)
 * Action: Crops image, uploads cookies, updates Category
 */
export const confirmCookieCrops = functionsV2.https.onCall(
  {
    region: 'us-west1',
    memory: '1GiB', // Sharp might need more memory
  },
  async (request) => {
    // Check authentication (admin only)
    if (!request.auth || request.auth.token.admin !== true) {
      throw new functionsV2.https.HttpsError('permission-denied', 'Only admins can confirm crops.');
    }

    const { batchId, crops } = request.data;

    if (!batchId || !Array.isArray(crops)) {
      throw new functionsV2.https.HttpsError(
        'invalid-argument',
        'BatchId and crops array required.',
      );
    }

    console.log(`Confirming crops for batch ${batchId} with ${crops.length} crops`);

    const db = admin.firestore();
    const batchRef = db.collection(TARGET_COLLECTION).doc(batchId);
    const batchSnap = await batchRef.get();

    if (!batchSnap.exists) {
      throw new functionsV2.https.HttpsError('not-found', 'Batch not found.');
    }

    const batchData = batchSnap.data();
    const eventId = batchData?.eventId;
    const categoryId = batchData?.categoryId;
    const originalImageRef = batchData?.originalImageRef;

    if (!eventId || !categoryId || !originalImageRef) {
      throw new functionsV2.https.HttpsError('failed-precondition', 'Incomplete batch data.');
    }

    const bucket = admin.storage().bucket(); // Default bucket
    const tempFilePath = path.join(os.tmpdir(), `confirm-${batchId}.jpg`);

    try {
      // Download original image
      const file = bucket.file(originalImageRef);
      await file.download({ destination: tempFilePath });

      // Get metadata for dimensions
      const imageMetadata = await sharp(tempFilePath).metadata();
      const imageWidth = imageMetadata.width || 0;
      const imageHeight = imageMetadata.height || 0;

      const cookies: Array<{ id: string; imageUrl: string }> = [];

      // Process crops
      for (let i = 0; i < crops.length; i++) {
        const crop = crops[i]; // { x, y, width, height } in 0-1 normalized stats

        // Convert to pixels
        const left = Math.max(0, Math.floor(crop.x * imageWidth));
        const top = Math.max(0, Math.floor(crop.y * imageHeight));
        const width = Math.min(imageWidth - left, Math.ceil(crop.width * imageWidth));
        const height = Math.min(imageHeight - top, Math.ceil(crop.height * imageHeight));

        if (width <= 0 || height <= 0) {
          console.warn(`Skipping invalid crop: ${JSON.stringify(crop)}`);
          continue;
        }

        const cookieId = `cookie-${Date.now()}-${i}`;
        const croppedImagePath = path.join(os.tmpdir(), `${cookieId}.jpg`);

        await sharp(tempFilePath)
          .extract({ left, top, width, height })
          .jpeg({ quality: 95 })
          .toFile(croppedImagePath);

        // Upload
        const storagePath = `processed_cookies/${batchId}/${cookieId}.jpg`;
        const storageFile = bucket.file(storagePath);
        await storageFile.save(await fs.readFile(croppedImagePath), {
          contentType: 'image/jpeg',
          metadata: {
            metadata: {
              batchId,
              cookieId,
              originalFile: originalImageRef,
            },
          },
        });

        await storageFile.makePublic();
        const bucketName = bucket.name;
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

        cookies.push({
          id: cookieId,
          imageUrl: publicUrl,
        });

        await fs.remove(croppedImagePath);
      }

      // Update Category
      const categoryRef = db
        .collection('events')
        .doc(eventId)
        .collection('categories')
        .doc(categoryId);
      await categoryRef.update({ cookies });

      // Update Batch
      await batchRef.update({
        status: 'ready',
        totalCandidates: cookies.length,
      });

      return { success: true, count: cookies.length };
    } catch (error) {
      console.error('Error confirming crops:', error);
      throw new functionsV2.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      await fs.remove(tempFilePath).catch(() => {});
    }
  },
);
