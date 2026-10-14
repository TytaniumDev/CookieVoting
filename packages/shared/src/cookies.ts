import { readingOrder } from './geometry.ts'
import type { Box, Cookie } from './types.ts'

const sameBox = (a: Box, b: Box) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Replays one editor's change (`base` → `next`) onto a plate's `current` cookies, so
 * edits saved meanwhile from another device or by another admin survive. New cookies
 * are added, moved ones take their new box (unless someone else deleted them), removed
 * ones are dropped, and every other cookie stays as `current` has it.
 */
export function mergeCookieEdits(
  base: readonly Cookie[],
  next: readonly Cookie[],
  current: readonly Cookie[],
): Cookie[] {
  const before = new Map(base.map((c) => [c.id, c.box]))
  const after = new Map(next.map((c) => [c.id, c.box]))
  const merged = current
    .filter((c) => !before.has(c.id) || after.has(c.id))
    .map((c) => {
      const box = after.get(c.id)
      const old = before.get(c.id)
      return box && old && !sameBox(box, old) ? { id: c.id, box } : c
    })
  const present = new Set(current.map((c) => c.id))
  const added = next.filter((c) => !before.has(c.id) && !present.has(c.id))
  return readingOrder([...merged, ...added])
}

/** Ids of the cookies an edit removed. */
export function removedCookieIds(base: readonly Cookie[], next: readonly Cookie[]): string[] {
  const kept = new Set(next.map((c) => c.id))
  return base.filter((c) => !kept.has(c.id)).map((c) => c.id)
}
