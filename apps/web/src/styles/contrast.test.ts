import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast.ts'

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21)
  })

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#9f1d2b', '#9f1d2b')).toBe(1)
  })

  it('matches a known WCAG value', () => {
    // #767676 on white is the classic 4.54:1 grey.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })

  it('rejects non-hex input', () => {
    expect(() => contrastRatio('red', '#ffffff')).toThrow('Expected #rrggbb')
  })
})
