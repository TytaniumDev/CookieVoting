/**
 * Core domain types. These mirror the Firestore documents described in
 * docs/ARCHITECTURE.md; Firestore-specific details (Timestamps, refs) stay in
 * the web app and Cloud Functions so this package remains dependency-free.
 */

export type EventStatus = 'setup' | 'voting' | 'results'

/** A rectangle normalised to the plate photo: every value is in the range 0..1. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** A single cookie identified on a plate photo. */
export interface Cookie {
  id: string
  box: Box
}

/** A voter's ranked picks for one category: [1st, 2nd, 3rd] cookie ids. */
export type CategoryRanking = readonly string[]

/** A voter's full ballot: category id -> ranked cookie ids. */
export type BallotRankings = Readonly<Record<string, CategoryRanking>>

/** The minimum a tally needs to know about a category. */
export interface TallyCategory {
  id: string
  name: string
  /** Cookie ids in display order. */
  cookieIds: readonly string[]
}

export interface TallyInput {
  /** Categories in display order. */
  categories: readonly TallyCategory[]
  /** categoryId -> cookieId -> bakerId. Unassigned cookies are simply absent. */
  assignments: Readonly<Record<string, Readonly<Record<string, string>>>>
  /** Every baker on the event roster: bakerId -> display name. */
  bakers: Readonly<Record<string, string>>
  ballots: readonly BallotRankings[]
}

export interface CookieStanding {
  cookieId: string
  bakerId: string | null
  bakerName: string | null
  points: number
  /** Competition rank: ties share a rank and the next rank is skipped (1, 2, 2, 4). */
  rank: number
}

export interface CategoryResult {
  categoryId: string
  name: string
  /** Sorted by rank, then by display order. */
  standings: CookieStanding[]
}

export interface BakerStanding {
  bakerId: string
  name: string
  points: number
  rank: number
}

export interface EventResults {
  ballotCount: number
  categories: CategoryResult[]
  bakers: BakerStanding[]
}
