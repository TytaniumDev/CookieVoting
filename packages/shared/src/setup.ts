import type { CategoryDoc, SetupDoc } from './documents.ts'
import type { EventStatus } from './types.ts'

/**
 * The admin flow's steps (PRD §6), in order. Every step is reachable at any time. Boxing
 * cookies and tagging each with its baker are one step (owner decision, 2026-10-14).
 */
export const SETUP_STEPS = ['bakers', 'categories', 'cookies', 'voting', 'results'] as const
export type SetupStep = (typeof SETUP_STEPS)[number]

export const SETUP_STEP_LABELS: Record<SetupStep, string> = {
  bakers: 'Bakers',
  categories: 'Categories',
  cookies: 'Cookies',
  voting: 'Voting',
  results: 'Results',
}

export interface SetupProgressInput {
  status: EventStatus
  setup: SetupDoc | null
  categories: readonly Pick<CategoryDoc, 'photo' | 'cookies'>[]
  /** Category ids in the same order as `categories`. */
  categoryIds: readonly string[]
}

export interface SetupProgress {
  done: Record<SetupStep, boolean>
  /** The first step that isn't done, or null when everything is. */
  current: SetupStep | null
  /** Open Voting needs bakers, categories and every cookie boxed and tagged. */
  readyToVote: boolean
  /** Every category has at least one cookie boxed. */
  boxed: boolean
  /** Cookies without a baker from the event roster. */
  unassignedCookies: number
}

/**
 * Derives the setup stepper's state from the event's data, so nothing extra is stored.
 * A cookie counts as assigned only if its baker is still on the roster: removing a
 * baker unassigns their cookies (owner decision Q4).
 */
export function setupProgress(input: SetupProgressInput): SetupProgress {
  const roster = new Set(input.setup?.bakerIds ?? [])
  const assignments = input.setup?.assignments ?? {}

  let unassignedCookies = 0
  input.categories.forEach((category, i) => {
    const categoryAssignments = assignments[input.categoryIds[i] ?? ''] ?? {}
    for (const cookie of category.cookies) {
      const bakerId = categoryAssignments[cookie.id]
      if (bakerId === undefined || !roster.has(bakerId)) unassignedCookies++
    }
  })

  const hasCategories = input.categories.length > 0
  const boxed = hasCategories && input.categories.every((c) => c.cookies.length > 0)
  const done: Record<SetupStep, boolean> = {
    bakers: roster.size > 0,
    categories: hasCategories && input.categories.every((c) => c.photo !== null),
    cookies: boxed && unassignedCookies === 0,
    voting: input.status === 'voting' || input.status === 'results',
    results: input.status === 'results',
  }
  const readyToVote = done.bakers && done.categories && done.cookies

  return {
    done,
    current: SETUP_STEPS.find((step) => !done[step]) ?? null,
    readyToVote,
    boxed,
    unassignedCookies,
  }
}

/**
 * Takes a baker off an event's roster and clears every cookie assigned to them, so
 * Open Voting stays blocked until those cookies are reassigned (owner decision Q4).
 */
export function removeBakerFromSetup(setup: SetupDoc, bakerId: string): SetupDoc {
  const assignments: SetupDoc['assignments'] = {}
  for (const [categoryId, cookies] of Object.entries(setup.assignments)) {
    assignments[categoryId] = Object.fromEntries(
      Object.entries(cookies).filter(([, assigned]) => assigned !== bakerId),
    )
  }
  return { bakerIds: setup.bakerIds.filter((id) => id !== bakerId), assignments }
}

/**
 * Whose cookie the admin taps next on a plate: the first baker on the roster without a
 * cookie on it, or null once everyone has one. Derived from the saved data, so a
 * reassignment that leaves someone without a cookie brings them back, and every admin's
 * screen agrees.
 */
export function nextBaker(
  rosterIds: readonly string[],
  cookieIds: readonly string[],
  assignments: Readonly<Record<string, string>>,
): string | null {
  const tagged = new Set(cookieIds.map((id) => assignments[id]))
  return rosterIds.find((id) => !tagged.has(id)) ?? null
}
