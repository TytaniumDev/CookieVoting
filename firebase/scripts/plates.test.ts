import { readingOrder } from '@cookie-voting/shared'
import { readdir } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { PLATES_DIR, plateBoxes } from './plates.ts'

const photos = (await readdir(PLATES_DIR)).filter((f) => f.endsWith('.jpg'))

describe('fixtures/plates ground truth', () => {
  it('has a label file for every photo', () => {
    expect(photos.length).toBeGreaterThan(0)
  })

  it.each(photos)('%s: one box per cookie, inside the photo, in reading order', async (photo) => {
    const boxes = await plateBoxes(photo)
    expect(boxes).toHaveLength(Number.parseInt(photo, 10))
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.width).toBeGreaterThan(0)
      expect(b.height).toBeGreaterThan(0)
      expect(b.x + b.width).toBeLessThanOrEqual(1)
      expect(b.y + b.height).toBeLessThanOrEqual(1)
    }
    const items = boxes.map((box) => ({ box }))
    expect(readingOrder(items)).toEqual(items)
  })
})
