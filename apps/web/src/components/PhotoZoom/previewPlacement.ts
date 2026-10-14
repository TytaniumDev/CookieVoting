import type { PlatePhoto } from '@cookie-voting/shared'

/** Space kept between the preview and the thumbnail or the window's edges, in px. */
const MARGIN = 16
/** The widest the hover preview gets, in px. */
const PREVIEW_WIDTH = 720

/**
 * Where the hover preview goes: beside the thumbnail (right if it fits, else left),
 * vertically centred on it, as big as fits and always inside the window.
 */
export function previewPlacement(
  thumb: Pick<DOMRect, 'left' | 'right' | 'top' | 'height'>,
  photo: Pick<PlatePhoto, 'width' | 'height'>,
  viewport: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const ratio = photo.height / photo.width
  const width = Math.max(
    0,
    Math.min(PREVIEW_WIDTH, viewport.width - 2 * MARGIN, (viewport.height - 2 * MARGIN) / ratio),
  )
  const height = width * ratio
  const clamp = (value: number, max: number) => Math.max(MARGIN, Math.min(value, max))
  const right = thumb.right + MARGIN
  const left =
    right + width <= viewport.width - MARGIN
      ? right
      : thumb.left - MARGIN - width >= MARGIN
        ? thumb.left - MARGIN - width
        : clamp(thumb.left, viewport.width - MARGIN - width)
  const top = clamp(thumb.top + thumb.height / 2 - height / 2, viewport.height - MARGIN - height)
  return { left, top, width, height }
}
