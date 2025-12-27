/**
 * Crop Utilities Tests
 *
 * Tests for the image slicing/cropping utilities that convert
 * regions of an image into individual Blob objects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sliceImage, type SliceRegion, validateRegion, clampRegion } from './cropUtils';

// Mock canvas and context for Node environment
class MockCanvasRenderingContext2D {
    private canvas: MockHTMLCanvasElement;
    drawImageCalls: Array<{
        sx: number;
        sy: number;
        sw: number;
        sh: number;
        dx: number;
        dy: number;
        dw: number;
        dh: number;
    }> = [];

    constructor(canvas: MockHTMLCanvasElement) {
        this.canvas = canvas;
    }

    drawImage(
        _source: CanvasImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): void {
        this.drawImageCalls.push({ sx, sy, sw, sh, dx, dy, dw, dh });
    }

    getImageData(): ImageData {
        return new ImageData(this.canvas.width, this.canvas.height);
    }
}

class MockHTMLCanvasElement {
    width = 0;
    height = 0;
    private context: MockCanvasRenderingContext2D;

    constructor() {
        this.context = new MockCanvasRenderingContext2D(this);
    }

    getContext(): MockCanvasRenderingContext2D {
        return this.context;
    }

    toBlob(callback: (blob: Blob | null) => void, type?: string): void {
        // Simulate blob creation
        const mockBlob = new Blob(['mock-image-data'], { type: type || 'image/png' });
        callback(mockBlob);
    }
}

// Mock HTMLImageElement
class MockHTMLImageElement {
    naturalWidth = 100;
    naturalHeight = 100;
    src = '';
}

describe('cropUtils', () => {
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
        // Store original
        originalCreateElement = document.createElement.bind(document);

        // Mock document.createElement for canvas
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'canvas') {
                return new MockHTMLCanvasElement() as unknown as HTMLCanvasElement;
            }
            return originalCreateElement(tagName);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('validateRegion', () => {
        it('should return true for valid region', () => {
            const region: SliceRegion = { x: 10, y: 10, width: 50, height: 50 };
            expect(validateRegion(region, 100, 100)).toBe(true);
        });

        it('should return false for zero width', () => {
            const region: SliceRegion = { x: 10, y: 10, width: 0, height: 50 };
            expect(validateRegion(region, 100, 100)).toBe(false);
        });

        it('should return false for zero height', () => {
            const region: SliceRegion = { x: 10, y: 10, width: 50, height: 0 };
            expect(validateRegion(region, 100, 100)).toBe(false);
        });

        it('should return false for negative dimensions', () => {
            const region: SliceRegion = { x: 10, y: 10, width: -50, height: 50 };
            expect(validateRegion(region, 100, 100)).toBe(false);
        });

        it('should return true for region at origin', () => {
            const region: SliceRegion = { x: 0, y: 0, width: 50, height: 50 };
            expect(validateRegion(region, 100, 100)).toBe(true);
        });

        it('should return true for region at edge', () => {
            const region: SliceRegion = { x: 50, y: 50, width: 50, height: 50 };
            expect(validateRegion(region, 100, 100)).toBe(true);
        });
    });

    describe('clampRegion', () => {
        it('should not modify valid region within bounds', () => {
            const region: SliceRegion = { x: 10, y: 10, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            expect(clamped).toEqual({ x: 10, y: 10, width: 50, height: 50 });
        });

        it('should clamp negative x to 0', () => {
            const region: SliceRegion = { x: -10, y: 10, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            expect(clamped.x).toBe(0);
            expect(clamped.width).toBe(40); // Reduced by the amount clamped
        });

        it('should clamp negative y to 0', () => {
            const region: SliceRegion = { x: 10, y: -20, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            expect(clamped.y).toBe(0);
            expect(clamped.height).toBe(30); // Reduced by the amount clamped
        });

        it('should clamp width that exceeds image bounds', () => {
            const region: SliceRegion = { x: 80, y: 10, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            expect(clamped.x).toBe(80);
            expect(clamped.width).toBe(20); // Clamped to not exceed 100
        });

        it('should clamp height that exceeds image bounds', () => {
            const region: SliceRegion = { x: 10, y: 90, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            expect(clamped.y).toBe(90);
            expect(clamped.height).toBe(10); // Clamped to not exceed 100
        });

        it('should handle region completely outside bounds', () => {
            const region: SliceRegion = { x: 150, y: 150, width: 50, height: 50 };
            const clamped = clampRegion(region, 100, 100);

            // When completely outside, should result in zero-size region
            expect(clamped.width).toBe(0);
            expect(clamped.height).toBe(0);
        });
    });

    describe('sliceImage', () => {
        it('should slice image into correct number of blobs', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            const regions: SliceRegion[] = [
                { x: 0, y: 0, width: 50, height: 50 },
                { x: 50, y: 0, width: 50, height: 50 },
                { x: 0, y: 50, width: 50, height: 50 },
                { x: 50, y: 50, width: 50, height: 50 },
            ];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs.length).toBe(4);
            blobs.forEach((blob) => {
                expect(blob).toBeInstanceOf(Blob);
            });
        });

        it('should skip invalid regions (zero size)', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            const regions: SliceRegion[] = [
                { x: 0, y: 0, width: 50, height: 50 },
                { x: 50, y: 0, width: 0, height: 50 }, // Invalid
                { x: 0, y: 50, width: 50, height: 0 }, // Invalid
            ];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs.length).toBe(1); // Only the valid one
        });

        it('should clamp out-of-bounds regions', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            mockImage.naturalWidth = 100;
            mockImage.naturalHeight = 100;

            const regions: SliceRegion[] = [
                { x: -10, y: -10, width: 50, height: 50 }, // Partially out of bounds
            ];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs.length).toBe(1);
        });

        it('should return empty array for empty regions', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            const regions: SliceRegion[] = [];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs).toEqual([]);
        });

        it('should return empty array when all regions are invalid', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            const regions: SliceRegion[] = [
                { x: 0, y: 0, width: 0, height: 50 },
                { x: 0, y: 0, width: 50, height: 0 },
            ];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs).toEqual([]);
        });

        it('should handle single region covering entire image', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            mockImage.naturalWidth = 100;
            mockImage.naturalHeight = 100;

            const regions: SliceRegion[] = [{ x: 0, y: 0, width: 100, height: 100 }];

            const blobs = await sliceImage(mockImage, regions);

            expect(blobs.length).toBe(1);
        });

        it('should create blobs with correct MIME type', async () => {
            const mockImage = new MockHTMLImageElement() as unknown as HTMLImageElement;
            const regions: SliceRegion[] = [{ x: 0, y: 0, width: 50, height: 50 }];

            const blobs = await sliceImage(mockImage, regions, 'image/jpeg');

            expect(blobs[0].type).toBe('image/jpeg');
        });
    });
});
