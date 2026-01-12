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
 * @param eventId - Event ID this batch belongs to
 * @param categoryId - Category ID this batch belongs to
 * @param options - Upload options including paddingPercentage
 * @returns The batch ID
 */
export async function uploadTray(
  file: File,
  batchId: string,
  eventId: string,
  categoryId: string,
  options?: UploadTrayOptions,
): Promise<string> {
  // Validate padding percentage if provided
  const paddingPercentage = options?.paddingPercentage ?? DEFAULT_PADDING_PERCENTAGE;
  if (paddingPercentage < 0 || paddingPercentage > 0.5) {
    throw new Error('paddingPercentage must be between 0 and 0.5 (0% to 50%)');
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uploadTray.ts:39',message:'uploadTray entry',data:{batchId,eventId,categoryId,fileSize:file.size,paddingPercentage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Create batch document first with status "uploading"
  const batchRef = doc(db, TARGET_COLLECTION, batchId);
  await setDoc(batchRef, {
    status: 'uploading',
    paddingPercentage,
    eventId,
    categoryId,
    createdAt: serverTimestamp(),
    originalImageRef: `uploads/${batchId}/original.jpg`,
  });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uploadTray.ts:52',message:'after setDoc batch',data:{batchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Upload image to Storage
  const storagePath = `uploads/${batchId}/original.jpg`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uploadTray.ts:58',message:'after uploadBytes',data:{batchId,storagePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // The Cloud Function will automatically trigger when the file is uploaded
  // and update the batch status to "processing" then "ready"

  return batchId;
}
