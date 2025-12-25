/**
 * Interface for detection strategies.
 * All strategies must implement this interface.
 */
export interface DetectionStrategy {
    detect(imageUrl: string): Promise<DetectedCookie[]>;
}

/**
 * Re-export DetectedCookie type for convenience
 */
export interface DetectedCookie {
    id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<[number, number]>;
    confidence: number;
}
