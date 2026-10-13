import type { Box } from './types.ts'

/**
 * Geometry for cookie boxes. Boxes are normalised to the plate photo: x and width
 * are fractions of its width, y and height of its height (docs/ARCHITECTURE.md →
 * Data model).
 */

export interface Point {
  x: number
  y: number
}

export type Corner = 'nw' | 'ne' | 'sw' | 'se'

/** Smallest box the editor makes, per axis. */
export const MIN_BOX_SIZE = 0.02

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Keeps a box inside the photo, shifting it rather than shrinking where it can. */
export function clampBox(box: Box): Box {
  const width = clamp(box.width, 0, 1)
  const height = clamp(box.height, 0, 1)
  return {
    x: clamp(box.x, 0, 1 - width),
    y: clamp(box.y, 0, 1 - height),
    width,
    height,
  }
}

/** The box spanning two points (in any order), clipped to the photo. */
export function boxFromPoints(a: Point, b: Point): Box {
  const x1 = clamp(Math.min(a.x, b.x), 0, 1)
  const y1 = clamp(Math.min(a.y, b.y), 0, 1)
  const x2 = clamp(Math.max(a.x, b.x), 0, 1)
  const y2 = clamp(Math.max(a.y, b.y), 0, 1)
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

export function moveBox(box: Box, dx: number, dy: number): Box {
  return clampBox({ ...box, x: box.x + dx, y: box.y + dy })
}

/**
 * Drags one corner to `point`, keeping the opposite corner fixed. The box can flip
 * past the fixed corner, and never gets smaller than `minSize` on either axis.
 */
export function resizeBox(box: Box, corner: Corner, point: Point, minSize = MIN_BOX_SIZE): Box {
  const fixed = {
    x: corner.endsWith('w') ? box.x + box.width : box.x,
    y: corner.startsWith('n') ? box.y + box.height : box.y,
  }
  const px = clamp(point.x, 0, 1)
  const py = clamp(point.y, 0, 1)
  const width = Math.max(Math.abs(px - fixed.x), minSize)
  const height = Math.max(Math.abs(py - fixed.y), minSize)
  return clampBox({
    x: px < fixed.x ? fixed.x - width : fixed.x,
    y: py < fixed.y ? fixed.y - height : fixed.y,
    width,
    height,
  })
}

/** Intersection over union: 1 for identical boxes, 0 for boxes that don't overlap. */
export function iou(a: Box, b: Box): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  if (width <= 0 || height <= 0) return 0
  const intersection = width * height
  return intersection / (a.width * a.height + b.width * b.height - intersection)
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

/**
 * Sorts items into reading order: rows top to bottom, then left to right. A box joins
 * the current row when its centre is within half the row's median box height of the
 * row's centre. Voters see cookies numbered `#1…#n` in this order.
 */
export function readingOrder<T extends { box: Box }>(items: readonly T[]): T[] {
  const centreY = (item: T) => item.box.y + item.box.height / 2
  const centreX = (item: T) => item.box.x + item.box.width / 2
  const rows: T[][] = []
  for (const item of [...items].sort((a, b) => centreY(a) - centreY(b))) {
    const row = rows.at(-1)
    if (row) {
      const rowCentre = row.reduce((sum, r) => sum + centreY(r), 0) / row.length
      const rowHeight = median(row.map((r) => r.box.height))
      if (Math.abs(centreY(item) - rowCentre) <= rowHeight / 2) {
        row.push(item)
        continue
      }
    }
    rows.push([item])
  }
  return rows.flatMap((row) => row.sort((a, b) => centreX(a) - centreX(b)))
}
