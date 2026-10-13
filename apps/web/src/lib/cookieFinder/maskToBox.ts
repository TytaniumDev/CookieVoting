import type { Box, Point } from '@cookie-voting/shared'

/** A square-ish window of the photo around a tap, in photo pixels. */
export interface CropWindow {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The window the segmenter looks at: `fraction` of the photo's long edge, centred on the
 * tap and shifted to stay inside the photo. Cropping makes the cookie bigger in the
 * model's 512 px input and leaves less background to confuse it (see ARCHITECTURE.md →
 * Tap-to-select).
 */
export function cropAround(
  point: Point,
  photo: { width: number; height: number },
  fraction = 0.6,
): CropWindow {
  const side = fraction * Math.max(photo.width, photo.height)
  const width = Math.min(side, photo.width)
  const height = Math.min(side, photo.height)
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max)
  return {
    x: Math.round(clamp(point.x * photo.width - width / 2, photo.width - width)),
    y: Math.round(clamp(point.y * photo.height - height / 2, photo.height - height)),
    width: Math.round(width),
    height: Math.round(height),
  }
}

/** Maps a box normalised to a crop window back to the whole photo. */
export function fromCrop(
  box: Box,
  crop: CropWindow,
  photo: { width: number; height: number },
): Box {
  return {
    x: (crop.x + box.x * crop.width) / photo.width,
    y: (crop.y + box.y * crop.height) / photo.height,
    width: (box.width * crop.width) / photo.width,
    height: (box.height * crop.height) / photo.height,
  }
}

/**
 * Turns the segmenter's confidence mask into the tapped cookie's box: the connected
 * region above `threshold` that contains the tap (or the nearest one within 3% of the
 * width, for a tap just off an edge). Regions less than `gap` pixels apart count as
 * connected. Returns null when nothing was found, or when the
 * region touches three or more sides of the window, which means the model picked the
 * table or tray rather than a cookie.
 */
export function maskToBox(
  mask: ArrayLike<number>,
  width: number,
  height: number,
  tap: Point,
  threshold = 0.5,
  gap = 0,
): Box | null {
  const on = (i: number) => (mask[i] ?? 0) > threshold
  const near = gap > 0 ? dilate(mask, width, height, threshold, gap) : null
  const passable = near ? (i: number) => near[i] === 1 : on
  const cx = Math.min(width - 1, Math.max(0, Math.floor(tap.x * width)))
  const cy = Math.min(height - 1, Math.max(0, Math.floor(tap.y * height)))

  let start = cy * width + cx
  if (!on(start)) {
    const r = Math.round(width * 0.03)
    let best = -1
    let bestDistance = Infinity
    for (let y = Math.max(0, cy - r); y <= Math.min(height - 1, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x <= Math.min(width - 1, cx + r); x++) {
        const d = (x - cx) ** 2 + (y - cy) ** 2
        if (d < bestDistance && on(y * width + x)) {
          best = y * width + x
          bestDistance = d
        }
      }
    }
    if (best < 0) return null
    start = best
  }

  // Flood fill (4-neighbour) from the tap, tracking the region's bounds.
  const seen = new Uint8Array(width * height)
  const stack = [start]
  seen[start] = 1
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  while (stack.length > 0) {
    const i = stack.pop()!
    const x = i % width
    const y = (i - x) / width
    // Pixels that only bridge a gap are walked through but aren't part of the cookie.
    if (on(i)) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
    const next = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1]
    next.push(y < height - 1 ? i + width : -1)
    for (const j of next) {
      if (j >= 0 && !seen[j] && passable(j)) {
        seen[j] = 1
        stack.push(j)
      }
    }
  }

  const sides =
    Number(x0 === 0) + Number(y0 === 0) + Number(x1 === width - 1) + Number(y1 === height - 1)
  if (sides >= 3) return null
  return {
    x: x0 / width,
    y: y0 / height,
    width: (x1 - x0 + 1) / width,
    height: (y1 - y0 + 1) / height,
  }
}

/**
 * The mask's on pixels grown by `radius` (a square max filter, done in two passes), so a
 * flood fill can cross thin gaps, e.g. between a cookie's icing and its base.
 */
function dilate(
  mask: ArrayLike<number>,
  width: number,
  height: number,
  threshold: number,
  radius: number,
): Uint8Array {
  const rows = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    let last = -Infinity
    for (let x = 0; x < width; x++) {
      if ((mask[y * width + x] ?? 0) > threshold) last = x
      if (x - last <= radius) rows[y * width + x] = 1
    }
    last = Infinity
    for (let x = width - 1; x >= 0; x--) {
      if ((mask[y * width + x] ?? 0) > threshold) last = x
      if (last - x <= radius) rows[y * width + x] = 1
    }
  }
  const out = new Uint8Array(width * height)
  for (let x = 0; x < width; x++) {
    let last = -Infinity
    for (let y = 0; y < height; y++) {
      if (rows[y * width + x]) last = y
      if (y - last <= radius) out[y * width + x] = 1
    }
    last = Infinity
    for (let y = height - 1; y >= 0; y--) {
      if (rows[y * width + x]) last = y
      if (last - y <= radius) out[y * width + x] = 1
    }
  }
  return out
}
