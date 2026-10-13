import { describe, expect, it } from 'vitest'
import { boxFromPoints, clampBox, iou, moveBox, readingOrder, resizeBox } from './geometry.ts'

const box = (x: number, y: number, width = 0.1, height = 0.1) => ({ x, y, width, height })

describe('clampBox', () => {
  it('shifts a box back inside the photo without shrinking it', () => {
    expect(clampBox(box(0.95, -0.05))).toEqual(box(0.9, 0))
  })
  it('caps boxes bigger than the photo', () => {
    expect(clampBox(box(-1, -1, 2, 3))).toEqual(box(0, 0, 1, 1))
  })
})

describe('boxFromPoints', () => {
  it('accepts the points in any order and clips to the photo', () => {
    const b = boxFromPoints({ x: 0.5, y: 1.2 }, { x: 0.2, y: 0.4 })
    expect(b.x).toBe(0.2)
    expect(b.y).toBe(0.4)
    expect(b.width).toBeCloseTo(0.3)
    expect(b.height).toBeCloseTo(0.6)
  })
})

describe('moveBox', () => {
  it('moves and stops at the edge', () => {
    const moved = moveBox(box(0.1, 0.1), 0.2, 0.05)
    expect(moved.x).toBeCloseTo(0.3)
    expect(moved.y).toBeCloseTo(0.15)
    expect(moveBox(box(0.1, 0.1), -0.5, 2)).toEqual(box(0, 0.9))
  })
})

describe('resizeBox', () => {
  it('drags a corner while the opposite one stays put', () => {
    const b = resizeBox(box(0.2, 0.2, 0.2, 0.2), 'se', { x: 0.6, y: 0.5 })
    expect(b.x).toBe(0.2)
    expect(b.y).toBe(0.2)
    expect(b.width).toBeCloseTo(0.4)
    expect(b.height).toBeCloseTo(0.3)
  })
  it('flips past the fixed corner', () => {
    const b = resizeBox(box(0.2, 0.2, 0.2, 0.2), 'nw', { x: 0.5, y: 0.6 })
    expect(b.x).toBeCloseTo(0.4)
    expect(b.y).toBeCloseTo(0.4)
    expect(b.width).toBeCloseTo(0.1)
    expect(b.height).toBeCloseTo(0.2)
  })
  it('keeps a minimum size', () => {
    const b = resizeBox(box(0.2, 0.2, 0.2, 0.2), 'ne', { x: 0.2, y: 0.4 }, 0.05)
    expect(b.width).toBe(0.05)
    expect(b.height).toBeCloseTo(0.05)
  })
})

describe('iou', () => {
  it('is 1 for the same box and 0 for disjoint boxes', () => {
    expect(iou(box(0.1, 0.1), box(0.1, 0.1))).toBe(1)
    expect(iou(box(0.1, 0.1), box(0.5, 0.5))).toBe(0)
  })
  it('measures partial overlap', () => {
    // Half of each box overlaps: 0.005 / (0.01 + 0.01 - 0.005).
    expect(iou(box(0, 0), box(0.05, 0))).toBeCloseTo(1 / 3)
  })
})

describe('readingOrder', () => {
  it('reads rows top to bottom, then left to right, tolerating wobbly rows', () => {
    const cookies = [
      { id: 'd', box: box(0.5, 0.52) },
      { id: 'b', box: box(0.5, 0.12) },
      { id: 'c', box: box(0.1, 0.5) },
      { id: 'a', box: box(0.1, 0.1) },
      { id: 'e', box: box(0.8, 0.47) },
    ]
    expect(readingOrder(cookies).map((c) => c.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it("doesn't change its input", () => {
    const cookies = [{ box: box(0.5, 0.5) }, { box: box(0, 0) }]
    readingOrder(cookies)
    expect(cookies[0]?.box.x).toBe(0.5)
  })
})
