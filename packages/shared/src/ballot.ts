import type { CategoryRanking } from './types.ts'

/** Voters rank up to this many cookies per category. */
export const MAX_PICKS = 3

/** How many cookies a voter can rank in a category with `cookieCount` cookies. */
export function maxPicksFor(cookieCount: number): number {
  return Math.max(0, Math.min(MAX_PICKS, cookieCount))
}

/**
 * A voter's medals in one category while they vote: index 0 holds the cookie with
 * 1st place, index 1 2nd, and so on; null is a medal not given yet. Medals can be
 * given in any order, so there can be gaps until every one is given.
 */
export type CategoryPlaces = readonly (string | null)[]

/** No medals given yet, for a category with `cookieCount` cookies. */
export function emptyPlaces(cookieCount: number): CategoryPlaces {
  return Array.from({ length: maxPicksFor(cookieCount) }, () => null)
}

/**
 * Gives `cookieId` the medal for `place` (1-based), or takes it back if the cookie
 * already has it.
 *
 * - A cookie holds one medal at most: giving it another moves it.
 * - A medal is on one cookie at most: giving it to a new cookie takes it off the old one.
 */
export function awardPlace(
  places: CategoryPlaces,
  cookieId: string,
  place: number,
): CategoryPlaces {
  const index = place - 1
  if (index < 0 || index >= places.length) return places
  if (places[index] === cookieId) return places.map((id, i) => (i === index ? null : id))
  return places.map((id, i) => (i === index ? cookieId : id === cookieId ? null : id))
}

/** True once every medal in the category is given. */
export function allPlacesGiven(places: CategoryPlaces): places is CategoryRanking {
  return places.every((id) => id !== null)
}

/** 1-based rank of `cookieId` in `ranking`, or null when it is not ranked. */
export function rankOf(ranking: CategoryPlaces, cookieId: string): number | null {
  const index = ranking.indexOf(cookieId)
  return index === -1 ? null : index + 1
}
