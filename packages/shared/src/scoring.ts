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

function pointsByCookie(
  category: TallyCategory,
  ballots: readonly BallotRankings[],
): Map<string, number> {
  const points = new Map(category.cookieIds.map((id) => [id, 0]))
  const validIds = new Set(category.cookieIds)
  for (const ballot of ballots) {
    const picks = sanitizeRanking(ballot[category.id], validIds)
    picks.forEach((cookieId, position) => {
      points.set(cookieId, (points.get(cookieId) ?? 0) + (BORDA_POINTS[position] ?? 0))
    })
  }
  return points
}

/** Computes per-category cookie rankings and the overall baker leaderboard. */
export function tallyResults(input: TallyInput): EventResults {
  const bakerPoints = new Map(Object.keys(input.bakers).map((id) => [id, 0]))

  const categories: CategoryResult[] = input.categories.map((category) => {
    const points = pointsByCookie(category, input.ballots)
    const assignments = input.assignments[category.id] ?? {}

    const unranked = category.cookieIds.map((cookieId) => {
      const bakerId = assignments[cookieId] ?? null
      const bakerName = bakerId === null ? null : (input.bakers[bakerId] ?? null)
      const cookiePoints = points.get(cookieId) ?? 0
      if (bakerId !== null && bakerPoints.has(bakerId)) {
        bakerPoints.set(bakerId, (bakerPoints.get(bakerId) ?? 0) + cookiePoints)
      }
      return { cookieId, bakerId, bakerName, points: cookiePoints }
    })

    // Array.prototype.sort is stable, so ties keep their display order.
    const sorted = unranked.sort((a, b) => b.points - a.points)
    const ranks = competitionRanks(sorted, (entry) => entry.points)
    const standings: CookieStanding[] = sorted.map((entry, i) => ({ ...entry, rank: ranks[i]! }))

    return { categoryId: category.id, name: category.name, standings }
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
