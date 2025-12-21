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
export async function detectCookiesGemini(
  imageUrl: string
): Promise<DetectedCookie[]> {
  console.log('[CookieDetection] Starting cookie detection');
  console.log('[CookieDetection] Image URL:', imageUrl);
  
  try {
    // Get reference to the callable function
    console.log('[CookieDetection] Getting function reference: detectCookiesWithGemini');
    const detectCookies = httpsCallable<{ imageUrl: string }, { cookies: DetectedCookie[]; count: number }>(
      functions,
      'detectCookiesWithGemini'
    );

    // Call the function
    console.log('[CookieDetection] Calling Firebase function with imageUrl:', imageUrl);
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
    console.error('[CookieDetection] Error detecting cookies with Gemini:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[CookieDetection] Error name:', error.name);
      console.error('[CookieDetection] Error message:', error.message);
      console.error('[CookieDetection] Error stack:', error.stack);
      
      // Check if it's a Firebase error with code/details
      const firebaseError = error as any;
      if (firebaseError.code) {
        console.error('[CookieDetection] Firebase error code:', firebaseError.code);
      }
      if (firebaseError.details) {
        console.error('[CookieDetection] Firebase error details:', firebaseError.details);
      }
      if (firebaseError.message) {
        console.error('[CookieDetection] Full error message:', firebaseError.message);
      }
      
      // Provide helpful error messages
      if (error.message.includes('unauthenticated')) {
        throw new Error('You must be signed in to use cookie detection.');
      } else if (error.message.includes('failed-precondition')) {
        throw new Error('Gemini API is not configured. Please contact the administrator.');
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        throw new Error('Cookie detection service is not available. Please deploy Firebase Functions first.');
      }
    } else {
      console.error('[CookieDetection] Unknown error type:', typeof error);
      console.error('[CookieDetection] Error value:', error);
    }
    
    throw new Error('Failed to detect cookies. Please try again or use manual tagging.');
  }
}

