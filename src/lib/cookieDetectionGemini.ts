import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface DetectedCookie {
  id?: string; // Unique ID for this detected cookie (generated when detected)
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
 * Detects cookies in an image using Gemini AI via Firebase Functions
 * @param imageUrl - URL of the image to analyze
 * @returns Array of detected cookie positions
 */
export async function detectCookiesGemini(imageUrl: string): Promise<DetectedCookie[]> {
  console.log('[CookieDetection] Starting cookie detection');
  console.log('[CookieDetection] Image URL:', imageUrl);

  try {
    // Get reference to the callable function
    console.log('[CookieDetection] Getting function reference: detectCookiesWithGemini');
    const detectCookies = httpsCallable<
      { imageUrl: string },
      { cookies: DetectedCookie[]; count: number }
    >(functions, 'detectCookiesWithGemini');

    // Call the function with retry logic
    const maxRetries = 2;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[CookieDetection] Calling Firebase function (attempt ${attempt + 1}/${maxRetries + 1})`);
        const result = await detectCookies({ imageUrl });

        console.log('[CookieDetection] Function call completed');
        console.log('[CookieDetection] Result data:', result.data);
        console.log('[CookieDetection] Cookies count:', result.data?.count);
        console.log('[CookieDetection] Cookies array:', result.data?.cookies);

        // Return the detected cookies
        const cookies = result.data?.cookies || [];
        console.log('[CookieDetection] Returning', cookies.length, 'cookies');
        return cookies;
      } catch (error) {
        lastError = error;
        console.error(`[CookieDetection] Error on attempt ${attempt + 1}:`, error);

        // Check for fatal errors that shouldn't be retried
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes('unauthenticated') ||
            msg.includes('failed-precondition') ||
            msg.includes('not found') ||
            msg.includes('404')
          ) {
            // Throw specific errors immediately
            if (msg.includes('unauthenticated')) {
              throw new Error('You must be signed in to use cookie detection.');
            } else if (msg.includes('failed-precondition')) {
              throw new Error('Gemini API is not configured. Please contact the administrator.');
            } else {
               throw new Error(
                'Cookie detection service is not available. Please deploy Firebase Functions first.',
              );
            }
          }
        }

        // If this was the last attempt, break loop (will throw below)
        if (attempt === maxRetries) break;
        
        // Optional: Add a small delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Process the last error after all retries failed
    const error = lastError;
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[CookieDetection] Final error name:', error.name);
      console.error('[CookieDetection] Final error message:', error.message);
      console.error('[CookieDetection] Final error stack:', error.stack);

      // Check if it's a Firebase error with code/details
      interface FirebaseError {
        code?: string;
        details?: unknown;
      }
      const firebaseError = error as FirebaseError;
      if (firebaseError.code) {
        console.error('[CookieDetection] Firebase error code:', firebaseError.code);
      }
      if (firebaseError.details) {
        console.error('[CookieDetection] Firebase error details:', firebaseError.details);
      }
    } else {
      console.error('[CookieDetection] Unknown error type:', typeof error);
      console.error('[CookieDetection] Error value:', error);
    }

    throw new Error('Failed to detect cookies. Please try again or use manual tagging.');
  } catch (error) {
    // If we re-throw a specific error (like "You must be signed in"), just let it propagate
    if (error instanceof Error && (
        error.message.includes('signed in') || 
        error.message.includes('configured') || 
        error.message.includes('service is not available')
    )) {
        throw error;
    }
    
    // Fallback for any other errors caught in the outer block (should mostly be handled inside loop)
    console.error('[CookieDetection] Unhandled error:', error);
    throw new Error('Failed to detect cookies. Please try again or use manual tagging.');
  }
}
