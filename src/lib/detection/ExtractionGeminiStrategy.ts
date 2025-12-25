import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Extended DetectedCookie interface with extracted URL
 */
export interface ExtractedCookie {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<[number, number]>;
    confidence: number;
    extractedUrl?: string;
}

/**
 * Response from the extraction function
 */
export interface ExtractionResult {
    cookies: ExtractedCookie[];
    count: number;
    transparentImagePath: string; // Path to transparent image in storage
    spritesPath: string; // Path to sprites folder in storage
    geminiImageUrl?: string | null; // URL to Gemini-generated transparent image
}

/**
 * Calls the new extraction strategy function that uses Sharp to create
 * individual cookie images from a source image.
 *
 * @param imageUrl - URL of the source image
 * @param sourceFilePath - Optional file path for Firestore reference
 * @returns Extraction result with cookie URLs
 */
export async function extractCookiesWithSharp(
    imageUrl: string,
    sourceFilePath?: string,
): Promise<ExtractionResult> {
    console.log('[ExtractionStrategy] Starting cookie extraction');
    console.log('[ExtractionStrategy] Image URL:', imageUrl);

    try {
        const extractCookies = httpsCallable<
            { imageUrl: string; sourceFilePath?: string },
            ExtractionResult
        >(functions, 'extractCookiesWithSegmentation');

        const result = await extractCookies({ imageUrl, sourceFilePath });

        console.log('[ExtractionStrategy] Extraction completed');
        console.log('[ExtractionStrategy] Result:', result.data);

        return result.data;
    } catch (error) {
        console.error('[ExtractionStrategy] Error extracting cookies:', error);

        if (error instanceof Error) {
            if (error.message.includes('unauthenticated')) {
                throw new Error('You must be signed in to use cookie extraction.');
            } else if (error.message.includes('not found') || error.message.includes('404')) {
                throw new Error(
                    'Cookie extraction service is not available. Please deploy Firebase Functions first.',
                );
            }
        }

        throw new Error('Failed to extract cookies. Please try again.');
    }
}
