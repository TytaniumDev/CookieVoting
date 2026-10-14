/**
 * The timed results reveal (owner decision 2026-10-14): the ornaments drop onto the
 * garland closed, then open from last place to 1st with a drumroll before each, about
 * 5 seconds in all.
 */

/** Where the reveal is: whether the ornaments have dropped, which are open, which shakes. */
export interface RevealState {
  dropped: boolean
  /** How many are open, counted from the last place: 1 means only 3rd is open. */
  opened: number
  /** Index (in place order, 0 = 1st) of the ornament shaking before it opens. */
  drum: number | null
}

export type RevealStep =
  { at: number; kind: 'drum'; index: number } | { at: number; kind: 'open'; index: number }

/** Every ornament open, nothing moving. */
export function revealed(count: number): RevealState {
  return { dropped: true, opened: count, drum: null }
}

/** Dropped and closed, before the first drumroll. */
export const DROPPED: RevealState = { dropped: true, opened: 0, drum: null }

/** How long the last ornament stays the centre of attention before the reveal is over. */
export const CELEBRATE_MS = 2000

/**
 * The steps for `count` ornaments (1–3), timed from the drop. Each ornament shakes, then
 * opens; the winner's drumroll is longest.
 */
export function revealSteps(count: number): RevealStep[] {
  const steps: RevealStep[] = []
  let at = 1000
  for (let index = count - 1; index >= 0; index--) {
    const last = index === 0
    steps.push({ at, kind: 'drum', index })
    at += last ? 1500 : 800
    steps.push({ at, kind: 'open', index })
    at += index === 1 ? 500 : 400
  }
  return steps
}

/** The state after `step`. */
export function applyStep(state: RevealState, step: RevealStep): RevealState {
  return step.kind === 'drum'
    ? { ...state, drum: step.index }
    : { ...state, drum: null, opened: state.opened + 1 }
}

/** Whether the ornament at `index` (0 = 1st) of `count` is open. */
export function isOpen(state: RevealState, index: number, count: number): boolean {
  return state.opened >= count - index
}
