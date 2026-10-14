import { describe, expect, it } from 'vitest'
import { garlandY, layoutOrnaments } from './layout.ts'

describe('garlandY', () => {
  it('follows the garland path through its end points', () => {
    expect(garlandY(0)).toBe(10)
    expect(garlandY(200)).toBe(22)
    expect(garlandY(400)).toBe(10)
  })
})

describe('layoutOrnaments', () => {
  it('hangs 1st biggest and lowest, in the middle, on a phone', () => {
    const { ornaments } = layoutOrnaments(343, 480, 3)
    const [first, second, third] = ornaments
    expect(first!.x).toBeCloseTo(171.5)
    expect(first!.size).toBeGreaterThan(second!.size)
    expect(first!.ballTop).toBeGreaterThan(second!.ballTop + second!.size)
    expect(second!.x).toBeLessThan(first!.x)
    expect(third!.x).toBeGreaterThan(first!.x)
  })

  it('starts every string on the garland, above its ball', () => {
    for (const [width, height] of [
      [343, 480],
      [768, 380],
    ] as const) {
      const { garlandHeight, ornaments } = layoutOrnaments(width, height, 3)
      for (const o of ornaments) {
        expect(o.hookY).toBeGreaterThan(0)
        expect(o.hookY).toBeLessThan(garlandHeight)
        expect(o.ballTop).toBeGreaterThan(o.hookY + 12)
      }
    }
  })

  it('places only as many ornaments as there are cookies', () => {
    expect(layoutOrnaments(343, 480, 2).ornaments).toHaveLength(2)
  })
})
