import { describe, expect, it } from 'vitest'
import { tiedRanks } from './tiedRanks.ts'

describe('tiedRanks', () => {
  it('finds the ranks more than one entry shares', () => {
    const ranks = [1, 2, 2, 4, 5, 5, 5].map((rank) => ({ rank }))
    expect(tiedRanks(ranks)).toEqual(new Set([2, 5]))
  })

  it('is empty without ties', () => {
    expect(tiedRanks([{ rank: 1 }, { rank: 2 }])).toEqual(new Set())
  })
})
