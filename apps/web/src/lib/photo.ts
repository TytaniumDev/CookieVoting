/** Long edge of stored plate photos, and their JPEG quality (ARCHITECTURE.md → Photo upload). */
export const MAX_PHOTO_EDGE = 2048
export const PHOTO_QUALITY = 0.85

/** Scales a size down (never up) so its long edge is at most `maxEdge`. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export interface PreparedPhoto {
  blob: Blob
  width: number
  height: number
}

/**
 * Turns a phone photo into what we store: EXIF rotation applied, long edge at most
 * 2048 px, JPEG at 85%. A 12 MP photo shrinks to roughly 300–600 KB.
 */
export async function preparePlatePhoto(file: Blob): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height)
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error("This browser can't process photos")
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: PHOTO_QUALITY })
    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}
