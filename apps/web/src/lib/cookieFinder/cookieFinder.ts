import { InteractiveSegmenterLegacy } from '@mediapipe/tasks-vision'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import type { Box, Point } from '@cookie-voting/shared'
// Google's magic_touch model (Apache-2.0), version 1 from
// storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/.
// Served from this site so it's cached like any other asset and tests need no network.
import modelAssetPath from './magic_touch.tflite?url'
import { cropAround, fromCrop, maskToBox } from './maskToBox.ts'

/**
 * Tap-to-select (ARCHITECTURE.md → Tap-to-select): MediaPipe's Interactive Segmenter
 * with the `magic_touch` model, run in the browser. Admin-only and loaded lazily: about
 * 9 MB to download the first time (6 MB model, 3.4 MB gzipped runtime), then cached.
 */
/** Side of the square the model sees; magic_touch works at 512 px. */
const INPUT_SIZE = 512

export interface CookieFinder {
  /** The box of the cookie at `point` (normalised to the photo), or null if none. */
  find(photo: HTMLImageElement, point: Point): Box | null
}

export async function createCookieFinder(): Promise<CookieFinder> {
  const segmenter = await InteractiveSegmenterLegacy.createFromOptions(
    { wasmLoaderPath, wasmBinaryPath },
    {
      baseOptions: { modelAssetPath },
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    },
  )
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No 2D canvas')

  return {
    find(photo, point) {
      const size = { width: photo.naturalWidth, height: photo.naturalHeight }
      const crop = cropAround(point, size)
      const scale = INPUT_SIZE / Math.max(crop.width, crop.height)
      canvas.width = Math.round(crop.width * scale)
      canvas.height = Math.round(crop.height * scale)
      context.drawImage(
        photo,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      const tap = {
        x: (point.x * size.width - crop.x) / crop.width,
        y: (point.y * size.height - crop.y) / crop.height,
      }
      const result = segmenter.segment(canvas, { keypoint: tap })
      try {
        const mask = result.confidenceMasks?.at(-1)
        if (!mask) return null
        const box = maskToBox(mask.getAsFloat32Array(), mask.width, mask.height, tap)
        return box && fromCrop(box, crop, size)
      } finally {
        for (const mask of result.confidenceMasks ?? []) mask.close()
      }
    },
  }
}
