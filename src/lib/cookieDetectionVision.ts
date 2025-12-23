import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { DetectedCookie } from './cookieDetectionGemini';

export interface VisionAPIRawResults {
  objects: Array<{
    name: string;
    score: number;
  }>;
  labels: Array<{
    description: string;
    score: number;
  }>;
}

export interface VisionDetectionResponse {
  cookies: DetectedCookie[];
  count: number;
  rawResults: VisionAPIRawResults;
  provider: 'vision-api';
}

export interface ComparisonResults {
  imageUrl: string;
  results: {
    gemini: {
      cookies: DetectedCookie[];
      count: number;
      duration: number;
      error?: string;
    };
    vision: {
      cookies: DetectedCookie[];
      count: number;
      duration: number;
      objects: Array<{ name: string; score: number }>;
      labels: Array<{ description: string; score: number }>;
      error?: string;
    };
  };
  summary: {
    geminiCount: number;
    visionCount: number;
    geminiDuration: number;
    visionDuration: number;
  };
}

/**
 * Detects cookies in an image using Google Cloud Vision API via Firebase Functions
 * @param imageUrl - URL of the image to analyze
 * @returns Detection results including cookies and raw Vision API data
 */
export async function detectCookiesVision(imageUrl: string): Promise<VisionDetectionResponse> {
  console.log('[VisionDetection] Starting Vision API detection');
  console.log('[VisionDetection] Image URL:', imageUrl);

  try {
    const detectCookies = httpsCallable<
      { imageUrl: string },
      VisionDetectionResponse
    >(functions, 'detectCookiesWithVision');

    console.log('[VisionDetection] Calling Firebase function');
    const result = await detectCookies({ imageUrl });

    console.log('[VisionDetection] Function call completed');
    console.log('[VisionDetection] Cookies count:', result.data?.count);

    return result.data;
  } catch (error) {
    console.error('[VisionDetection] Error detecting with Vision API:', error);

    if (error instanceof Error) {
      console.error('[VisionDetection] Error message:', error.message);
      
      if (error.message.includes('unauthenticated')) {
        throw new Error('You must be signed in to use cookie detection.');
      }
    }

    throw new Error('Failed to detect cookies with Vision API. Please try again.');
  }
}

/**
 * Compares both Gemini and Vision API detection results for the same image
 * @param imageUrl - URL of the image to analyze
 * @returns Comparison results from both APIs
 */
export async function compareDetectionMethods(imageUrl: string): Promise<ComparisonResults> {
  console.log('[CompareDetection] Starting comparison');
  console.log('[CompareDetection] Image URL:', imageUrl);

  try {
    const compare = httpsCallable<
      { imageUrl: string },
      ComparisonResults
    >(functions, 'compareDetectionMethods');

    console.log('[CompareDetection] Calling Firebase function');
    const result = await compare({ imageUrl });

    console.log('[CompareDetection] Comparison completed');
    console.log('[CompareDetection] Gemini count:', result.data.summary.geminiCount);
    console.log('[CompareDetection] Vision count:', result.data.summary.visionCount);

    return result.data;
  } catch (error) {
    console.error('[CompareDetection] Error comparing detection methods:', error);

    if (error instanceof Error) {
      console.error('[CompareDetection] Error message:', error.message);
      
      if (error.message.includes('unauthenticated')) {
        throw new Error('You must be signed in to compare detection methods.');
      }
    }

    throw new Error('Failed to compare detection methods. Please try again.');
  }
}
