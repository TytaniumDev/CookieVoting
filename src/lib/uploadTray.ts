import { ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';

const TARGET_COLLECTION = 'cookie_batches';
const DEFAULT_PADDING_PERCENTAGE = 0.1; // 10% default padding

export interface UploadTrayOptions {
  /**
   * Padding percentage (0.0-0.5, default: 0.1)
   * Percentage of extra space added around each cookie when cropping
   */
  paddingPercentage?: number;
}

/**
 * Upload a tray image and create a batch document
 * @param file - The image file to upload
 * @param batchId - Unique batch ID (typically generated with UUID or timestamp)
 * @param options - Upload options including paddingPercentage
 * @returns The batch ID
 */
export async function uploadTray(
  file: File,
  batchId: string,
  options?: UploadTrayOptions,
): Promise<string> {
  // Validate padding percentage if provided
  const paddingPercentage = options?.paddingPercentage ?? DEFAULT_PADDING_PERCENTAGE;
  if (paddingPercentage < 0 || paddingPercentage > 0.5) {
    throw new Error('paddingPercentage must be between 0 and 0.5 (0% to 50%)');
  }

  // Create batch document first with status "uploading"
  const batchRef = doc(db, TARGET_COLLECTION, batchId);
  await setDoc(batchRef, {
    status: 'uploading',
    paddingPercentage,
    createdAt: serverTimestamp(),
    originalImageRef: `uploads/${batchId}/original.jpg`,
  });

  // Upload image to Storage
  const storagePath = `uploads/${batchId}/original.jpg`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);

  // The Cloud Function will automatically trigger when the file is uploaded
  // and update the batch status to "processing" then "ready"

  return batchId;
}
