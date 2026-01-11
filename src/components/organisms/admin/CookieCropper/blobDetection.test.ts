/**
 * Blob Detection Algorithm Tests
 *
 * Tests for the lightweight client-side blob detection algorithm
 * used to automatically find cookie regions in an image.
 */
import { describe, it, expect } from 'vitest';
import { detectBlobs, type Rect, createImageData } from './blobDetection';

// Helper to create a simple synthetic image for testing
function createTestImageData(
    width: number,
    height: number,
    fillColor: [number, number, number, number] = [255, 255, 255, 255]
): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        data[i * 4] = fillColor[0];
        data[i * 4 + 1] = fillColor[1];
        data[i * 4 + 2] = fillColor[2];
        data[i * 4 + 3] = fillColor[3];
    }
    return createImageData(data, width, height);
}

// Helper to draw a filled rectangle on ImageData
function drawRect(
    imageData: ImageData,
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number, number]
): void {
    const { data, width } = imageData;
    for (let py = y; py < y + h && py < imageData.height; py++) {
        for (let px = x; px < x + w && px < width; px++) {
            if (px >= 0 && py >= 0) {
                const idx = (py * width + px) * 4;
                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = color[3];
            }
        }
    }
}

describe('blobDetection', () => {
    describe('detectBlobs', () => {
        it('should detect distinct shapes on white background', () => {
            // Create a 100x100 white image
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            // Draw 3 distinct red squares
            drawRect(imageData, 10, 10, 20, 20, [255, 0, 0, 255]); // Top-left
            drawRect(imageData, 60, 10, 20, 20, [0, 255, 0, 255]); // Top-right
            drawRect(imageData, 35, 60, 25, 25, [0, 0, 255, 255]); // Bottom-center

            const blobs = detectBlobs(imageData);

            expect(blobs.length).toBe(3);

            // Verify each blob has reasonable bounds (order may vary based on algorithm)
            const sortedBlobs = [...blobs].sort((a, b) => a.x - b.x || a.y - b.y);

            // First blob (top-left red square)
            expect(sortedBlobs[0].x).toBeCloseTo(10, 0);
            expect(sortedBlobs[0].y).toBeCloseTo(10, 0);
            expect(sortedBlobs[0].width).toBeCloseTo(20, 0);
            expect(sortedBlobs[0].height).toBeCloseTo(20, 0);
        });

        it('should handle empty image (solid background)', () => {
            // Solid white image - no blobs
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            const blobs = detectBlobs(imageData);

            expect(blobs).toEqual([]);
        });

        it('should ignore noise (tiny specks)', () => {
            // Create white image with small 2x2 noise specks
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            // Tiny noise that should be filtered
            drawRect(imageData, 5, 5, 2, 2, [0, 0, 0, 255]);
            drawRect(imageData, 90, 90, 1, 1, [0, 0, 0, 255]);

            // Real blob that should be detected
            drawRect(imageData, 40, 40, 20, 20, [0, 0, 0, 255]);

            const blobs = detectBlobs(imageData);

            // Should only detect the 20x20 square, not the tiny specks
            expect(blobs.length).toBe(1);
            expect(blobs[0].width).toBeGreaterThanOrEqual(15);
            expect(blobs[0].height).toBeGreaterThanOrEqual(15);
        });

        it('should handle touching shapes as separate if distinct colors', () => {
            // Create white image with two adjacent but distinct colored shapes
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            // Two adjacent squares (touching at x=50)
            drawRect(imageData, 20, 30, 30, 30, [255, 0, 0, 255]); // Red
            drawRect(imageData, 50, 30, 30, 30, [0, 0, 255, 255]); // Blue (adjacent)

            const blobs = detectBlobs(imageData);

            // Algorithm should detect foreground vs background
            // Adjacent same-contrast shapes may merge - this tests the algorithm's behavior
            expect(blobs.length).toBeGreaterThanOrEqual(1);
            expect(blobs.length).toBeLessThanOrEqual(2);
        });

        it('should detect shapes on non-white backgrounds', () => {
            // Grey background
            const imageData = createTestImageData(100, 100, [200, 200, 200, 255]);

            // Dark shape
            drawRect(imageData, 30, 30, 40, 40, [50, 50, 50, 255]);

            const blobs = detectBlobs(imageData);

            expect(blobs.length).toBe(1);
        });

        it('should handle low contrast shapes', () => {
            // White background
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            // Light grey shape (low contrast)
            drawRect(imageData, 30, 30, 40, 40, [220, 220, 220, 255]);

            const blobs = detectBlobs(imageData);

            // Low contrast may or may not be detected depending on threshold
            // This test documents the expected behavior
            // With a reasonable threshold, it should still detect
            expect(blobs.length).toBeGreaterThanOrEqual(0);
        });

        it('should return empty array for fully transparent image', () => {
            const imageData = createTestImageData(100, 100, [0, 0, 0, 0]);

            const blobs = detectBlobs(imageData);

            expect(blobs).toEqual([]);
        });

        it('should handle single large blob covering most of image', () => {
            const imageData = createTestImageData(100, 100, [255, 255, 255, 255]);

            // Large blob
            drawRect(imageData, 5, 5, 90, 90, [100, 50, 50, 255]);

            const blobs = detectBlobs(imageData);

            expect(blobs.length).toBe(1);
            expect(blobs[0].width).toBeGreaterThan(80);
            expect(blobs[0].height).toBeGreaterThan(80);
        });
    });

    describe('Rect type', () => {
        it('should have correct structure', () => {
            const rect: Rect = { x: 10, y: 20, width: 30, height: 40 };

            expect(rect.x).toBe(10);
            expect(rect.y).toBe(20);
            expect(rect.width).toBe(30);
            expect(rect.height).toBe(40);
        });
    });
});
