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

      // Get paddingPercentage from batch document (default to 0.1 if not set)
      const batchData = (await batchRef.get()).data();
      let paddingPercentage = batchData?.paddingPercentage ?? DEFAULT_PADDING_PERCENTAGE;

      // Validate padding is within range
      if (typeof paddingPercentage !== 'number' || paddingPercentage < MIN_PADDING || paddingPercentage > MAX_PADDING) {
        console.warn(
          `Invalid paddingPercentage ${paddingPercentage}, using default ${DEFAULT_PADDING_PERCENTAGE}`,
        );
        paddingPercentage = DEFAULT_PADDING_PERCENTAGE;
      }

      // Download image to temp directory
      const file = bucket.file(filePath);
      await file.download({ destination: tempFilePath });

      // Call Vision API objectLocalization
      console.log(`Calling Vision API for ${filePath}`);
      // @ts-expect-error - objectLocalization exists but TypeScript types may not be fully accurate
      const [result] = await visionClient.objectLocalization(tempFilePath);

      const objects = result.localizedObjectAnnotations || [];
      console.log(`Vision API detected ${objects.length} objects`);

      if (objects.length === 0) {
        await batchRef.update({
          status: 'ready',
          totalCandidates: 0,
        });
        console.log(`No objects detected in ${filePath}`);
        return;
      }

      // Read original image metadata
      const imageMetadata = await sharp(tempFilePath).metadata();
      const imageWidth = imageMetadata.width || 0;
      const imageHeight = imageMetadata.height || 0;

      // Process each detected object
      let candidateCount = 0;
      for (const obj of objects) {
        if (!obj.boundingPoly || !obj.boundingPoly.normalizedVertices || obj.boundingPoly.normalizedVertices.length < 2) {
          console.warn('Skipping object with invalid boundingPoly');
          continue;
        }

        const vertices = obj.boundingPoly.normalizedVertices;

        // Calculate bounding box from normalized vertices (0-1 coordinates)
        const minX = Math.min(...vertices.map((v) => v.x || 0));
        const minY = Math.min(...vertices.map((v) => v.y || 0));
        const maxX = Math.max(...vertices.map((v) => v.x || 1));
        const maxY = Math.max(...vertices.map((v) => v.y || 1));

        // Convert normalized coordinates to pixel coordinates
        let x = Math.floor(minX * imageWidth);
        let y = Math.floor(minY * imageHeight);
        let width = Math.ceil((maxX - minX) * imageWidth);
        let height = Math.ceil((maxY - minY) * imageHeight);

        // Apply padding
        const padX = Math.floor(width * paddingPercentage);
        const padY = Math.floor(height * paddingPercentage);

        x = Math.max(0, x - padX);
        y = Math.max(0, y - padY);
        width = Math.min(imageWidth - x, width + padX * 2);
        height = Math.min(imageHeight - y, height + padY * 2);

        // Ensure dimensions are valid
        if (width <= 0 || height <= 0) {
          console.warn('Skipping object with invalid dimensions after padding');
          continue;
        }

        // Crop using Sharp
        const cookieId = `cookie-${Date.now()}-${candidateCount}`;
        const croppedImagePath = path.join(os.tmpdir(), `${cookieId}.jpg`);
        await sharp(tempFilePath)
          .extract({ left: x, top: y, width, height })
          .jpeg({ quality: 95 })
          .toFile(croppedImagePath);

        // Upload cropped image to Storage
        const storagePath = `processed_cookies/${batchId}/${cookieId}.jpg`;
        const storageFile = bucket.file(storagePath);
        await storageFile.save(await fs.readFile(croppedImagePath), {
          contentType: 'image/jpeg',
          metadata: {
            metadata: {
              originalFile: filePath,
              batchId,
              cookieId,
            },
          },
        });

        // Make file publicly accessible
        await storageFile.makePublic();

        // Save to Firestore
        await batchRef.collection('candidates').doc(cookieId).set({
          storagePath,
          detectedLabel: obj.name || 'cookie',
          confidence: obj.score || 0,
          votes: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Clean up temp cropped image
        await fs.remove(croppedImagePath);

        candidateCount++;
      }

      // Update batch status to ready
      await batchRef.update({
        status: 'ready',
        totalCandidates: candidateCount,
      });

      console.log(`Processed ${candidateCount} cookies for batch ${batchId}`);
    } catch (error) {
      console.error(`Error processing cookie image ${filePath}:`, error);
      await batchRef.update({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Clean up temp original image
      try {
        await fs.remove(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
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
