import { describe, expect, it } from 'vitest'
import { fitWithin } from './photo.ts'

describe('fitWithin', () => {
  it('shrinks a 12 MP phone photo to a 2048 px long edge', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 2048, height: 1536 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 1536, height: 2048 })
  })

  it('leaves small photos alone', () => {
    expect(fitWithin(1000, 750)).toEqual({ width: 1000, height: 750 })
  })
})
