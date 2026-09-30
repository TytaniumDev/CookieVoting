import { describe, expect, it } from 'vitest'
import { maxPicksFor, rankOf, toggleRanking } from './ballot.ts'

describe('maxPicksFor', () => {
  it('caps picks at three', () => {
    expect(maxPicksFor(12)).toBe(3)
  })

  it('allows fewer picks when a category has fewer cookies', () => {
    expect(maxPicksFor(2)).toBe(2)
    expect(maxPicksFor(0)).toBe(0)
  })
})

describe('toggleRanking', () => {
  it('appends an unranked cookie as the next rank', () => {
    expect(toggleRanking([], 'a', 3)).toEqual(['a'])
    expect(toggleRanking(['a'], 'b', 3)).toEqual(['a', 'b'])
  })

  it('removes a ranked cookie and shifts later picks up', () => {
    expect(toggleRanking(['a', 'b', 'c'], 'b', 3)).toEqual(['a', 'c'])
    expect(toggleRanking(['a', 'b', 'c'], 'a', 3)).toEqual(['b', 'c'])
  })

  it('ignores new picks once every slot is full', () => {
    const full = ['a', 'b', 'c']
    expect(toggleRanking(full, 'd', 3)).toBe(full)
  })

  it('respects a reduced maximum for small categories', () => {
    expect(toggleRanking(['a', 'b'], 'c', 2)).toEqual(['a', 'b'])
  })
})

describe('rankOf', () => {
  it('returns the 1-based rank or null', () => {
    expect(rankOf(['a', 'b'], 'b')).toBe(2)
    expect(rankOf(['a', 'b'], 'z')).toBeNull()
  })
})
