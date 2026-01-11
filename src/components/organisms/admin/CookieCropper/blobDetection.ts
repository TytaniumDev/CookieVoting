/**
 * Blob Detection Algorithm
 *
 * Lightweight client-side algorithm to detect distinct regions (blobs)
 * in an image. Used to automatically find cookie regions in a tray photo.
 *
 * Algorithm:
 * 1. Sample background color from image corners
 * 2. Create binary mask (foreground vs background)
 * 3. Find connected components using flood fill
 * 4. Calculate bounding boxes for each component
 * 5. Filter out small noise regions
 */

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

// Configuration
const MIN_BLOB_SIZE = 100; // Minimum pixels to not be considered noise
const COLOR_THRESHOLD = 40; // How different a pixel must be from background

/**
 * Create ImageData from raw pixel array (for testing in Node environment)
 */
export function createImageData(
    data: Uint8ClampedArray,
    width: number,
    height: number
): ImageData {
    // In browser, use native ImageData
    if (typeof ImageData !== 'undefined') {
        try {
            return new ImageData(data, width, height);
        } catch {
            // Fallback for environments where ImageData constructor is restricted
        }
    }
    // Fallback structure
    return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

/**
 * Sample the background color by averaging corner pixels
 */
function sampleBackgroundColor(imageData: ImageData): [number, number, number] {
    const { data, width, height } = imageData;

    const corners: Point[] = [
        { x: 0, y: 0 },
        { x: width - 1, y: 0 },
        { x: 0, y: height - 1 },
        { x: width - 1, y: height - 1 },
    ];

    let r = 0, g = 0, b = 0;
    let validCorners = 0;

    for (const corner of corners) {
        const idx = (corner.y * width + corner.x) * 4;
        const alpha = data[idx + 3];

        // Skip fully transparent pixels
        if (alpha > 10) {
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            validCorners++;
        }
    }

    if (validCorners === 0) {
        return [255, 255, 255]; // Default to white if no valid corners
    }

    return [
        Math.round(r / validCorners),
        Math.round(g / validCorners),
        Math.round(b / validCorners),
    ];
}

/**
 * Check if a pixel color is significantly different from background
 */
function isForeground(
    r: number,
    g: number,
    b: number,
    bgR: number,
    bgG: number,
    bgB: number
): boolean {
    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    return diff > COLOR_THRESHOLD;
}

/**
 * Create a binary mask of foreground pixels
 */
function createForegroundMask(
    imageData: ImageData,
    bgColor: [number, number, number]
): boolean[] {
    const { data, width, height } = imageData;
    const mask = new Array(width * height).fill(false);

    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const alpha = data[idx + 3];

        // Skip transparent pixels
        if (alpha < 10) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (isForeground(r, g, b, bgColor[0], bgColor[1], bgColor[2])) {
            mask[i] = true;
        }
    }

    return mask;
}

/**
 * Find connected components using iterative flood fill
 */
function findConnectedComponents(
    mask: boolean[],
    width: number,
    height: number
): number[][] {
    const visited = new Array(width * height).fill(false);
    const components: number[][] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            if (mask[idx] && !visited[idx]) {
                // Start new component with flood fill
                const component: number[] = [];
                const stack: Point[] = [{ x, y }];

                while (stack.length > 0) {
                    const point = stack.pop();
                    if (!point) continue;

                    const pIdx = point.y * width + point.x;

                    if (
                        point.x < 0 || point.x >= width ||
                        point.y < 0 || point.y >= height ||
                        visited[pIdx] || !mask[pIdx]
                    ) {
                        continue;
                    }

                    visited[pIdx] = true;
                    component.push(pIdx);

                    // Add neighbors (4-connected)
                    stack.push({ x: point.x + 1, y: point.y });
                    stack.push({ x: point.x - 1, y: point.y });
                    stack.push({ x: point.x, y: point.y + 1 });
                    stack.push({ x: point.x, y: point.y - 1 });
                }

                if (component.length >= MIN_BLOB_SIZE) {
                    components.push(component);
                }
            }
        }
    }

    return components;
}

/**
 * Calculate bounding box for a component
 */
function componentToBoundingBox(
    component: number[],
    width: number
): Rect {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const idx of component) {
        const x = idx % width;
        const y = Math.floor(idx / width);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
}

/**
 * Detect blobs (distinct regions) in an image
 *
 * @param imageData - The image data to analyze
 * @returns Array of bounding boxes for detected regions
 */
export function detectBlobs(imageData: ImageData): Rect[] {
    const { width, height, data } = imageData;

    // Handle empty/invalid input
    if (width === 0 || height === 0 || data.length === 0) {
        return [];
    }

    // Check for fully transparent image
    let hasVisiblePixels = false;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 10) {
            hasVisiblePixels = true;
            break;
        }
    }
    if (!hasVisiblePixels) {
        return [];
    }

    // Step 1: Sample background color
    const bgColor = sampleBackgroundColor(imageData);

    // Step 2: Create foreground mask
    const mask = createForegroundMask(imageData, bgColor);

    // Step 3: Find connected components
    const components = findConnectedComponents(mask, width, height);

    // Step 4: Convert to bounding boxes
    const blobs = components.map((component) =>
        componentToBoundingBox(component, width)
    );

    return blobs;
}

/**
 * Detect blobs from an HTMLImageElement
 * Convenience wrapper that handles canvas conversion
 */
export async function detectBlobsFromImage(image: HTMLImageElement): Promise<Rect[]> {
    const canvas = document.createElement('canvas');
    const maxDim = 300; // Downsample for performance

    const scale = Math.min(1, maxDim / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get canvas context');
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const blobs = detectBlobs(imageData);

    // Scale bounding boxes back to original image coordinates
    return blobs.map((blob) => ({
        x: Math.round(blob.x / scale),
        y: Math.round(blob.y / scale),
        width: Math.round(blob.width / scale),
        height: Math.round(blob.height / scale),
    }));
}
