import { describe, expect, it } from 'vitest'
import { bakerCookies, competitionRanks, sanitizeRanking, tallyResults } from './scoring.ts'
import type { CategoryResult, TallyInput } from './types.ts'

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

  it("counts each cookie's 1st, 2nd and 3rd place votes and the voters per category", () => {
    const results = tallyResults({
      ...baseInput,
      ballots: [
        { sugar: ['s1', 's2', 's3'] },
        { sugar: ['s2', 's1', 's4'] },
        { sugar: ['s1', 's3', 's2'], choc: ['c1', 'c2'] },
      ],
    })
    const sugar = results.categories[0]!
    expect(sugar.ballotCount).toBe(3)
    expect(Object.fromEntries(sugar.standings.map((s) => [s.cookieId, s.votes]))).toEqual({
      s1: [2, 1, 0],
      s2: [1, 1, 1],
      s3: [0, 1, 1],
      s4: [0, 0, 1],
    })
    expect(results.categories[1]!.ballotCount).toBe(1)
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

describe('bakerCookies', () => {
  const standing = (cookieId: string, bakerId: string | null, points: number, rank: number) => ({
    cookieId,
    bakerId,
    bakerName: bakerId,
    points,
    rank,
  })
  const categories: CategoryResult[] = [
    {
      categoryId: 'trees',
      name: 'Trees',
      standings: [
        standing('t1', 'bob', 9, 1),
        standing('t2', 'ann', 4, 2),
        standing('t3', null, 1, 3),
      ],
    },
    {
      categoryId: 'stars',
      name: 'Stars',
      standings: [standing('s1', 'ann', 7, 1), standing('s2', 'bob', 2, 2)],
    },
    { categoryId: 'cats', name: 'Cats', standings: [standing('c1', 'ann', 4, 1)] },
  ]

  it("lists a baker's cookies best first, with their category and its size", () => {
    expect(bakerCookies(categories, 'ann')).toEqual([
      {
        categoryId: 'stars',
        categoryName: 'Stars',
        categorySize: 2,
        standing: categories[1]!.standings[0],
      },
      {
        categoryId: 'trees',
        categoryName: 'Trees',
        categorySize: 3,
        standing: categories[0]!.standings[1],
      },
      {
        categoryId: 'cats',
        categoryName: 'Cats',
        categorySize: 1,
        standing: categories[2]!.standings[0],
      },
    ])
  })

  it("adds up to the baker's total from tallyResults", () => {
    const results = tallyResults({
      categories: [
        { id: 'a', name: 'A', cookieIds: ['a1', 'a2'] },
        { id: 'b', name: 'B', cookieIds: ['b1', 'b2'] },
      ],
      assignments: { a: { a1: 'ann', a2: 'bob' }, b: { b1: 'bob', b2: 'ann' } },
      bakers: { ann: 'Ann', bob: 'Bob' },
      ballots: [
        { a: ['a1', 'a2'], b: ['b2', 'b1'] },
        { a: ['a2'], b: ['b1'] },
      ],
    })
    for (const baker of results.bakers) {
      const sum = bakerCookies(results.categories, baker.bakerId).reduce(
        (total, c) => total + c.standing.points,
        0,
      )
      expect(sum).toBe(baker.points)
    }
  })

  it('is empty for a baker with no cookies', () => {
    expect(bakerCookies(categories, 'nobody')).toEqual([])
  })
})
