import { describe, expect, it } from 'vitest'
import { competitionRanks, sanitizeRanking, tallyResults } from './scoring.ts'
import type { TallyInput } from './types.ts'

describe('competitionRanks', () => {
  it('gives tied scores the same rank and skips the next rank', () => {
    expect(competitionRanks([9, 7, 7, 3], (n) => n)).toEqual([1, 2, 2, 4])
  })

  it('handles all-tied and empty lists', () => {
    expect(competitionRanks([0, 0, 0], (n) => n)).toEqual([1, 1, 1])
    expect(competitionRanks([], (n: number) => n)).toEqual([])
  })
})

describe('sanitizeRanking', () => {
  const valid = new Set(['a', 'b', 'c', 'd'])

  it('keeps valid picks in order', () => {
    expect(sanitizeRanking(['c', 'a'], valid)).toEqual(['c', 'a'])
  })

  it('drops unknown ids, duplicates, non-strings and extra picks', () => {
    expect(sanitizeRanking(['x', 'a', 'a', 7, 'b', 'c', 'd'], valid)).toEqual(['a', 'b', 'c'])
  })

  it('treats non-array input as an empty ranking', () => {
    expect(sanitizeRanking(undefined, valid)).toEqual([])
    expect(sanitizeRanking('a', valid)).toEqual([])
  })
})

describe('tallyResults', () => {
  const baseInput: TallyInput = {
    categories: [
      { id: 'sugar', name: 'Sugar', cookieIds: ['s1', 's2', 's3', 's4'] },
      { id: 'choc', name: 'Chocolate', cookieIds: ['c1', 'c2'] },
    ],
    assignments: {
      sugar: { s1: 'ann', s2: 'bob', s3: 'cat', s4: 'ann' },
      choc: { c1: 'bob', c2: 'cat' },
    },
    bakers: { ann: 'Ann', bob: 'Bob', cat: 'Cat', dan: 'Dan' },
    ballots: [],
  }

  it('awards 3/2/1 Borda points and ranks cookies with ties', () => {
    const results = tallyResults({
      ...baseInput,
      ballots: [{ sugar: ['s1', 's2', 's3'] }, { sugar: ['s2', 's1', 's4'] }],
    })

    const sugar = results.categories[0]!
    expect(sugar.standings.map((s) => [s.cookieId, s.points, s.rank])).toEqual([
      ['s1', 5, 1],
      ['s2', 5, 1],
      ['s3', 1, 3],
      ['s4', 1, 3],
    ])
    expect(sugar.standings[0]).toMatchObject({ bakerId: 'ann', bakerName: 'Ann' })
  })

  it('sums baker points across categories and ranks the leaderboard', () => {
    const results = tallyResults({
      ...baseInput,
      ballots: [
        { sugar: ['s1', 's4'], choc: ['c1', 'c2'] },
        { sugar: ['s3'], choc: ['c2'] },
      ],
    })

    // Ann: s1 3 + s4 2 = 5. Bob: c1 3 = 3. Cat: s3 3 + c2 (2 + 3) = 8. Dan: no cookies.
    expect(results.bakers).toEqual([
      { bakerId: 'cat', name: 'Cat', points: 8, rank: 1 },
      { bakerId: 'ann', name: 'Ann', points: 5, rank: 2 },
      { bakerId: 'bob', name: 'Bob', points: 3, rank: 3 },
      { bakerId: 'dan', name: 'Dan', points: 0, rank: 4 },
    ])
    expect(results.ballotCount).toBe(2)
  })

  it('awards 3 and 2 points in a two-cookie category', () => {
    const results = tallyResults({ ...baseInput, ballots: [{ choc: ['c2', 'c1'] }] })
    const choc = results.categories[1]!
    expect(choc.standings.map((s) => [s.cookieId, s.points])).toEqual([
      ['c2', 3],
      ['c1', 2],
    ])
  })

  it('ignores unknown categories and cookies from tampered ballots', () => {
    const results = tallyResults({
      ...baseInput,
      ballots: [{ sugar: ['c1', 's2'], bogus: ['s1'] }],
    })
    const sugar = results.categories[0]!
    expect(sugar.standings.find((s) => s.cookieId === 's2')?.points).toBe(3)
    expect(sugar.standings.find((s) => s.cookieId === 's1')?.points).toBe(0)
  })

  it('keeps unassigned cookies in category results without a baker', () => {
    const results = tallyResults({
      ...baseInput,
      assignments: { sugar: {}, choc: {} },
      ballots: [{ sugar: ['s1'] }],
    })
    expect(results.categories[0]!.standings[0]).toMatchObject({
      cookieId: 's1',
      bakerId: null,
      bakerName: null,
      points: 3,
    })
    expect(results.bakers.every((b) => b.points === 0)).toBe(true)
  })

  it('returns zeroed standings in display order before any votes', () => {
    const results = tallyResults(baseInput)
    expect(results.ballotCount).toBe(0)
    expect(results.categories[0]!.standings.map((s) => [s.cookieId, s.rank])).toEqual([
      ['s1', 1],
      ['s2', 1],
      ['s3', 1],
      ['s4', 1],
    ])
  })
})
