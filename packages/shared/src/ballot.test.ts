import { describe, expect, it } from 'vitest'
import { allPlacesGiven, awardPlace, emptyPlaces, maxPicksFor, rankOf } from './ballot.ts'

describe('maxPicksFor', () => {
  it('caps picks at three', () => {
    expect(maxPicksFor(12)).toBe(3)
  })

  it('allows fewer picks when a category has fewer cookies', () => {
    expect(maxPicksFor(2)).toBe(2)
    expect(maxPicksFor(0)).toBe(0)
  })
})

describe('emptyPlaces', () => {
  it('has one empty medal per pick', () => {
    expect(emptyPlaces(6)).toEqual([null, null, null])
    expect(emptyPlaces(2)).toEqual([null, null])
  })
})

describe('awardPlace', () => {
  it('gives medals in any order', () => {
    expect(awardPlace([null, null, null], 'a', 2)).toEqual([null, 'a', null])
    expect(awardPlace([null, 'a', null], 'b', 1)).toEqual(['b', 'a', null])
  })

  it('takes a medal back when the cookie already has it', () => {
    expect(awardPlace(['a', 'b', 'c'], 'b', 2)).toEqual(['a', null, 'c'])
  })

  it('moves a cookie to its new medal', () => {
    expect(awardPlace(['a', 'b', null], 'a', 3)).toEqual([null, 'b', 'a'])
  })

  it('moves a medal off the cookie that had it', () => {
    expect(awardPlace(['a', 'b', 'c'], 'd', 1)).toEqual(['d', 'b', 'c'])
  })

  it('ignores places a small category does not have', () => {
    const places = [null, null]
    expect(awardPlace(places, 'a', 3)).toBe(places)
  })
})

describe('allPlacesGiven', () => {
  it('is true only with no gaps', () => {
    expect(allPlacesGiven(['a', 'b', 'c'])).toBe(true)
    expect(allPlacesGiven(['a', null, 'c'])).toBe(false)
  })
})

describe('rankOf', () => {
  it('returns the 1-based rank or null', () => {
    expect(rankOf(['a', 'b'], 'b')).toBe(2)
    expect(rankOf([null, 'b'], 'b')).toBe(2)
    expect(rankOf(['a', 'b'], 'z')).toBeNull()
  })
})
