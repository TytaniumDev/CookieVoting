import type { CategoryRanking } from './types.ts'

/** Voters rank up to this many cookies per category. */
export const MAX_PICKS = 3

/** How many cookies a voter can rank in a category with `cookieCount` cookies. */
export function maxPicksFor(cookieCount: number): number {
  return Math.max(0, Math.min(MAX_PICKS, cookieCount))
}

/**
 * Applies a tap on a cookie card to a voter's ranking for one category.
 *
 * - Tapping a ranked cookie removes it; later picks shift up (2nd -> 1st, ...).
 * - Tapping an unranked cookie appends it as the next rank, if a slot is free.
 * - Tapping an unranked cookie when every slot is full leaves the ranking unchanged.
 */
export function toggleRanking(
  ranking: CategoryRanking,
  cookieId: string,
  maxPicks: number,
): CategoryRanking {
  if (ranking.includes(cookieId)) {
    return ranking.filter((id) => id !== cookieId)
  }
  if (ranking.length >= maxPicks) {
    return ranking
  }
  return [...ranking, cookieId]
}

/** 1-based rank of `cookieId` in `ranking`, or null when it is not ranked. */
export function rankOf(ranking: CategoryRanking, cookieId: string): number | null {
  const index = ranking.indexOf(cookieId)
  return index === -1 ? null : index + 1
}
