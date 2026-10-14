import { describe, expect, it } from 'vitest'
import { previewPlacement } from './previewPlacement.ts'

const photo = { width: 2048, height: 1536 }
const laptop = { width: 1440, height: 900 }
const thumb = (left: number, top: number) => ({ left, right: left + 64, top, height: 48 })

describe('previewPlacement', () => {
  it('goes to the right of the thumbnail, centred on it, at full size', () => {
    expect(previewPlacement(thumb(100, 400), photo, laptop)).toEqual({
      left: 180,
      top: 424 - 270,
      width: 720,
      height: 540,
    })
  })

  it('goes to the left when the right side is too narrow', () => {
    const place = previewPlacement(thumb(1200, 400), photo, laptop)
    expect(place.left).toBe(1200 - 16 - 720)
  })

  it('stays inside the window near its top and bottom edges', () => {
    expect(previewPlacement(thumb(100, 0), photo, laptop).top).toBe(16)
    expect(previewPlacement(thumb(100, 880), photo, laptop).top).toBe(900 - 16 - 540)
  })

  it('shrinks to fit a short window', () => {
    const place = previewPlacement(thumb(100, 100), photo, { width: 1440, height: 332 })
    expect(place.height).toBe(300)
    expect(place.width).toBe(400)
  })

  it('fits a phone-width window when neither side has room', () => {
    const place = previewPlacement(thumb(60, 100), photo, { width: 375, height: 800 })
    expect(place.width).toBe(375 - 32)
    expect(place.left).toBe(16)
  })
})
