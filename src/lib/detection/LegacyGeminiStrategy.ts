import { detectCookiesGemini, type DetectedCookie } from '../cookieDetectionGemini';
import type { DetectionStrategy } from './DetectionStrategy';

/**
 * Strategy that uses the legacy (original) Gemini detection implementation.
 * Wraps the existing 'detectCookiesGemini' function.
 */
export class LegacyGeminiStrategy implements DetectionStrategy {
    async detect(imageUrl: string): Promise<DetectedCookie[]> {
        console.log('[LegacyGeminiStrategy] Using legacy detection logic');
        return detectCookiesGemini(imageUrl);
    }
}
