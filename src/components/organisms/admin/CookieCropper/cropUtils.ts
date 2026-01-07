/**
 * Crop Utilities
 *
 * Functions for slicing an image into multiple regions
 * and generating Blob objects for each slice.
 */

/**
 * Grid configuration settings
 */
export interface GridConfig {
    rows: number;
    cols: number;
    padding: number;
}

/**
 * Crop region for slicing images.
 * Coordinates are in PIXELS (absolute position on the source image).
 */
export interface SliceRegion {
    /** X position in pixels from left edge of image */
    x: number;
    /** Y position in pixels from top edge of image */
    y: number;
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
    /** Whether this region has already been saved to the backend */
    isSaved?: boolean;
    /** ID of the saved image if isSaved is true */
    savedImageId?: string;
}

/**
 * Validate a region has positive dimensions
 */
export function validateRegion(
    region: SliceRegion,
    _imageWidth: number,
    _imageHeight: number
): boolean {
    return region.width > 0 && region.height > 0;
}

/**
 * Clamp a region to fit within image bounds
 * Adjusts x, y, width, height to ensure the region doesn't exceed image boundaries
 */
export function clampRegion(
    region: SliceRegion,
    imageWidth: number,
    imageHeight: number
): SliceRegion {
    // Clamp starting position
    const x = Math.max(0, region.x);
    const y = Math.max(0, region.y);

    // Calculate how much was clamped from the start
    const xOffset = x - region.x;
    const yOffset = y - region.y;

    // Adjust dimensions for the offset
    let width = region.width - xOffset;
    let height = region.height - yOffset;

    // Clamp ending position (ensure we don't exceed image bounds)
    width = Math.max(0, Math.min(width, imageWidth - x));
    height = Math.max(0, Math.min(height, imageHeight - y));

    return { x, y, width, height };
}

/**
 * Slice an image into multiple blobs based on regions
 *
 * @param image - Source image element
 * @param regions - Array of regions to slice
 * @param mimeType - Output MIME type (default: image/jpeg)
 * @param quality - JPEG quality (0-1, default: 0.9)
 * @returns Promise resolving to array of Blobs
 */
export async function sliceImage(
    image: HTMLImageElement,
    regions: SliceRegion[],
    mimeType: string = 'image/jpeg',
    quality: number = 0.9
): Promise<Blob[]> {
    if (regions.length === 0) {
        return [];
    }

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    const validRegions = regions
        .map((region) => clampRegion(region, imageWidth, imageHeight))
        .filter((region) => validateRegion(region, imageWidth, imageHeight));

    if (validRegions.length === 0) {
        return [];
    }

    const blobPromises = validRegions.map((region) => {
        return new Promise<Blob>((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = region.width;
                canvas.height = region.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Cannot get canvas context'));
                    return;
                }

                // Draw the region from the source image
                ctx.drawImage(
                    image,
                    region.x,
                    region.y,
                    region.width,
                    region.height,
                    0,
                    0,
                    region.width,
                    region.height
                );

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob'));
                        }
                    },
                    mimeType,
                    quality
                );
            } catch (error) {
                reject(error);
            }
        });
    });

    return Promise.all(blobPromises);
}

/**
 * Generate a uniform grid of regions
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @returns Array of SliceRegions forming a grid
 */
export function generateGrid(
    rows: number,
    cols: number,
    imageWidth: number,
    imageHeight: number
): SliceRegion[] {
    const regions: SliceRegion[] = [];
    const cellWidth = imageWidth / cols;
    const cellHeight = imageHeight / rows;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            regions.push({
                x: Math.round(col * cellWidth),
                y: Math.round(row * cellHeight),
                width: Math.round(cellWidth),
                height: Math.round(cellHeight),
            });
        }
    }

    return regions;
}

/**
 * Convert pixel coordinates to percentage coordinates
 */
export function pixelToPercent(
    region: SliceRegion,
    imageWidth: number,
    imageHeight: number
): SliceRegion {
    return {
        x: (region.x / imageWidth) * 100,
        y: (region.y / imageHeight) * 100,
        width: (region.width / imageWidth) * 100,
        height: (region.height / imageHeight) * 100,
    };
}

/**
 * Convert percentage coordinates to pixel coordinates
 */
export function percentToPixel(
    region: SliceRegion,
    imageWidth: number,
    imageHeight: number
): SliceRegion {
    return {
        x: Math.round((region.x / 100) * imageWidth),
        y: Math.round((region.y / 100) * imageHeight),
        width: Math.round((region.width / 100) * imageWidth),
        height: Math.round((region.height / 100) * imageHeight),
    };
}
