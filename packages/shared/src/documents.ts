/**
 * Shapes of the Firestore documents described in docs/ARCHITECTURE.md → Data model.
 * Timestamps are generic so this package stays free of Firebase SDK types: the web
 * app and Cloud Functions plug in their own SDK's `Timestamp`.
 */
import type { BakerStanding, BallotRankings, CategoryResult, Cookie, EventStatus } from './types.ts'

/** Collection and document paths, so callers don't spell them out by hand. */
export const paths = {
  admins: 'admins',
  admin: (email: string) => `admins/${email.toLowerCase()}`,
  adminRequests: 'adminRequests',
  adminRequest: (email: string) => `adminRequests/${email.toLowerCase()}`,
  bakers: 'bakers',
  baker: (bakerId: string) => `bakers/${bakerId}`,
  events: 'events',
  event: (eventId: string) => `events/${eventId}`,
  categories: (eventId: string) => `events/${eventId}/categories`,
  category: (eventId: string, categoryId: string) => `events/${eventId}/categories/${categoryId}`,
  setup: (eventId: string) => `events/${eventId}/private/setup`,
  ballots: (eventId: string) => `events/${eventId}/ballots`,
  ballot: (eventId: string, uid: string) => `events/${eventId}/ballots/${uid}`,
  results: (eventId: string) => `events/${eventId}/results/live`,
  platePhoto: (eventId: string, fileName: string) => `events/${eventId}/plates/${fileName}`,
} as const

/** `admins/{email}`: the admin allowlist. */
export interface AdminDoc<T> {
  addedAt: T
  /** Email of the admin who added this one; absent for admins added in the console. */
  addedBy?: string
}

/**
 * `adminRequests/{email}`: a signed-in Google user asking to become an admin. An admin
 * approves (adds them to `admins/` and deletes this) or declines (deletes this).
 */
export interface AdminRequestDoc<T> {
  requestedAt: T
  /** Their Google display name, to help admins recognise them. */
  name?: string
}

/** `bakers/{bakerId}`: the global roster. */
export interface BakerDoc<T> {
  name: string
  createdAt: T
}

/** `events/{eventId}` */
export interface EventDoc<T> {
  name: string
  status: EventStatus
  createdAt: T
  updatedAt: T
}

export interface PlatePhoto {
  /** Storage path, e.g. `events/{eventId}/plates/{uuid}.jpg`. */
  path: string
  url: string
  width: number
  height: number
}

/** `events/{eventId}/categories/{categoryId}` */
export interface CategoryDoc {
  name: string
  order: number
  photo: PlatePhoto | null
  /** Display (reading) order. */
  cookies: Cookie[]
}

/** `events/{eventId}/private/setup`: hidden from voters until results open. */
export interface SetupDoc {
  /** The event roster. */
  bakerIds: string[]
  /** categoryId -> cookieId -> bakerId */
  assignments: Record<string, Record<string, string>>
}

/** `events/{eventId}/ballots/{uid}` */
export interface BallotDoc<T> {
  rankings: BallotRankings
  submittedAt: T
  /** Set when the voter changes a category from the waiting screen. */
  updatedAt?: T
}

/** `events/{eventId}/results/live`: written by Cloud Functions only. */
export interface ResultsDoc<T> {
  ballotCount: number
  categories: CategoryResult[]
  bakers: BakerStanding[]
  updatedAt: T
  /** Snapshot time of the data these results were computed from; newer wins. */
  sourceReadTime: T
}
