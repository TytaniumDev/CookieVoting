import { MAX_PICKS } from './ballot.ts'
import type {
  BakerStanding,
  BallotRankings,
  CategoryResult,
  CookieStanding,
  EventResults,
  TallyCategory,
  TallyInput,
} from './types.ts'

/** Borda points by pick position: 1st = 3, 2nd = 2, 3rd = 1. */
export const BORDA_POINTS: readonly number[] = [3, 2, 1]

/**
 * Assigns competition ranks ("1224" ranking) to items already sorted by
 * descending score: tied items share a rank and the following rank is skipped.
 */
export function competitionRanks<T>(sorted: readonly T[], score: (item: T) => number): number[] {
  const ranks: number[] = []
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1]
    const previousRank = ranks[index - 1]
    const tiedWithPrevious =
      previous !== undefined && previousRank !== undefined && score(previous) === score(item)
    ranks.push(tiedWithPrevious ? previousRank : index + 1)
  })
  return ranks
}

/**
 * Reduces a submitted ranking to the picks that count. Ballots are untrusted
 * input, so unknown cookies are dropped, duplicates keep their first position,
 * and anything past the maximum number of picks is ignored.
 */
export function sanitizeRanking(ranking: unknown, validCookieIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(ranking)) return []
  const picks: string[] = []
  for (const cookieId of ranking) {
    if (picks.length >= MAX_PICKS) break
    if (typeof cookieId !== 'string') continue
    if (!validCookieIds.has(cookieId) || picks.includes(cookieId)) continue
    picks.push(cookieId)
  }
  return picks
}

interface CookieTally {
  points: number
  votes: [number, number, number]
}

function tallyCategory(
  category: TallyCategory,
  ballots: readonly BallotRankings[],
): { byCookie: Map<string, CookieTally>; ballotCount: number } {
  const byCookie = new Map(
    category.cookieIds.map((id) => [id, { points: 0, votes: [0, 0, 0] } as CookieTally]),
  )
  const validIds = new Set(category.cookieIds)
  let ballotCount = 0
  for (const ballot of ballots) {
    const picks = sanitizeRanking(ballot[category.id], validIds)
    if (picks.length > 0) ballotCount++
    picks.forEach((cookieId, position) => {
      const tally = byCookie.get(cookieId)!
      tally.points += BORDA_POINTS[position] ?? 0
      tally.votes[position] = (tally.votes[position] ?? 0) + 1
    })
  }
  return { byCookie, ballotCount }
}

/** Computes per-category cookie rankings and the overall baker leaderboard. */
export function tallyResults(input: TallyInput): EventResults {
  const bakerPoints = new Map(Object.keys(input.bakers).map((id) => [id, 0]))

  const categories: CategoryResult[] = input.categories.map((category) => {
    const { byCookie, ballotCount } = tallyCategory(category, input.ballots)
    const assignments = input.assignments[category.id] ?? {}

    const unranked = category.cookieIds.map((cookieId) => {
      const bakerId = assignments[cookieId] ?? null
      const bakerName = bakerId === null ? null : (input.bakers[bakerId] ?? null)
      const { points: cookiePoints, votes } = byCookie.get(cookieId)!
      if (bakerId !== null && bakerPoints.has(bakerId)) {
        bakerPoints.set(bakerId, (bakerPoints.get(bakerId) ?? 0) + cookiePoints)
      }
      return { cookieId, bakerId, bakerName, points: cookiePoints, votes }
    })

    // Array.prototype.sort is stable, so ties keep their display order.
    const sorted = unranked.sort((a, b) => b.points - a.points)
    const ranks = competitionRanks(sorted, (entry) => entry.points)
    const standings: CookieStanding[] = sorted.map((entry, i) => ({ ...entry, rank: ranks[i]! }))

    return { categoryId: category.id, name: category.name, ballotCount, standings }
  })

  const sortedBakers = [...bakerPoints.entries()]
    .map(([bakerId, points]) => ({ bakerId, name: input.bakers[bakerId]!, points }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  const bakerRanks = competitionRanks(sortedBakers, (baker) => baker.points)
  const bakers: BakerStanding[] = sortedBakers.map((baker, i) => ({
    ...baker,
    rank: bakerRanks[i]!,
  }))

  return { ballotCount: input.ballots.length, categories, bakers }
}

/** One of a baker's cookies in the results, with the category it was entered in. */
export interface BakerCookie {
  categoryId: string
  categoryName: string
  /** How many cookies the category has, for "2nd of 5". */
  categorySize: number
  standing: CookieStanding
}

/**
 * Every cookie one baker entered, best first (ties keep category order). Their points
 * add up to the baker's total, so this is the breakdown of a baker's score.
 */
export function bakerCookies(
  categories: readonly CategoryResult[],
  bakerId: string,
): BakerCookie[] {
  const cookies: BakerCookie[] = []
  for (const category of categories) {
    for (const standing of category.standings) {
      if (standing.bakerId !== bakerId) continue
      cookies.push({
        categoryId: category.categoryId,
        categoryName: category.name,
        categorySize: category.standings.length,
        standing,
      })
    }
  }
  // Array.prototype.sort is stable, so equal points stay in category order.
  return cookies.sort((a, b) => b.standing.points - a.standing.points)
}
