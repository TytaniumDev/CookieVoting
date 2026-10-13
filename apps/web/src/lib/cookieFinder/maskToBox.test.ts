import { describe, expect, it } from 'vitest'
import { cropAround, fromCrop, maskToBox } from './maskToBox.ts'

/** A width × height mask with the given rectangles (in pixels) set to 1. */
function mask(width: number, height: number, ...rects: [number, number, number, number][]) {
  const data = new Float32Array(width * height)
  for (const [x, y, w, h] of rects) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) data[j * width + i] = 1
  }
  return data
}

describe('maskToBox', () => {
  it('boxes the region under the tap and ignores other regions', () => {
    const m = mask(100, 100, [10, 20, 30, 40], [60, 60, 20, 20])
    expect(maskToBox(m, 100, 100, { x: 0.2, y: 0.3 })).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    })
  })

  it('bridges gaps narrower than `gap`, but not wider ones', () => {
    // Icing (top) split from the base (bottom) by a 3 px gap; another cookie 10 px away.
    const m = mask(100, 100, [10, 10, 30, 10], [10, 23, 30, 20], [50, 10, 20, 20])
    const tap = { x: 0.2, y: 0.15 }
    expect(maskToBox(m, 100, 100, tap)).toEqual({ x: 0.1, y: 0.1, width: 0.3, height: 0.1 })
    expect(maskToBox(m, 100, 100, tap, 0.5, 4)).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.33,
    })
  })

  it('snaps to a region just beside the tap', () => {
    const m = mask(100, 100, [10, 10, 20, 20])
    expect(maskToBox(m, 100, 100, { x: 0.315, y: 0.2 })).not.toBeNull()
  })

  it('finds nothing when the tap is far from any region', () => {
    expect(maskToBox(mask(100, 100, [10, 10, 5, 5]), 100, 100, { x: 0.8, y: 0.8 })).toBeNull()
  })

  it('rejects a region that fills the window, which is the background', () => {
    const m = mask(100, 100, [0, 0, 100, 90])
    expect(maskToBox(m, 100, 100, { x: 0.5, y: 0.5 })).toBeNull()
  })

  it('keeps a cookie cut off by one or two sides of the window', () => {
    const m = mask(100, 100, [0, 0, 30, 30])
    expect(maskToBox(m, 100, 100, { x: 0.1, y: 0.1 })).toEqual({
      x: 0,
      y: 0,
      width: 0.3,
      height: 0.3,
    })
  })
})

describe('cropAround and fromCrop', () => {
  const photo = { width: 2048, height: 1536 }

  it('centres the window on the tap', () => {
    expect(cropAround({ x: 0.5, y: 0.5 }, photo, 0.5)).toEqual({
      x: 512,
      y: 256,
      width: 1024,
      height: 1024,
    })
  })

  it('stays inside the photo near an edge', () => {
    expect(cropAround({ x: 0.02, y: 0.98 }, photo, 0.5)).toEqual({
      x: 0,
      y: 512,
      width: 1024,
      height: 1024,
    })
  })

  it('never exceeds the photo', () => {
    expect(cropAround({ x: 0.5, y: 0.5 }, photo, 1)).toEqual({
      x: 0,
      y: 0,
      width: 2048,
      height: 1536,
    })
  })

  it('maps a box in the window back to the photo', () => {
    const crop = { x: 512, y: 256, width: 1024, height: 1024 }
    expect(fromCrop({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 }, crop, photo)).toEqual({
      x: 0.375,
      y: 0.5,
      width: 0.25,
      height: 1 / 6,
    })
  })
})
