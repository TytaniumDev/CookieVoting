import { describe, expect, it } from 'vitest'
import { applyStep, DROPPED, isOpen, revealed, revealSteps } from './reveal.ts'

describe('revealSteps', () => {
  it('opens 3rd, 2nd then 1st, finishing at 5 seconds', () => {
    expect(revealSteps(3)).toEqual([
      { at: 1000, kind: 'drum', index: 2 },
      { at: 1800, kind: 'open', index: 2 },
      { at: 2200, kind: 'drum', index: 1 },
      { at: 3000, kind: 'open', index: 1 },
      { at: 3500, kind: 'drum', index: 0 },
      { at: 5000, kind: 'open', index: 0 },
    ])
  })

  it('handles categories with fewer than three cookies', () => {
    expect(revealSteps(1)).toEqual([
      { at: 1000, kind: 'drum', index: 0 },
      { at: 2500, kind: 'open', index: 0 },
    ])
    expect(revealSteps(0)).toEqual([])
  })
})

describe('applyStep', () => {
  it('opens the ornaments one at a time from the last place', () => {
    const states = revealSteps(3).reduce(
      (all, step) => [...all, applyStep(all.at(-1)!, step)],
      [DROPPED],
    )
    const openAt = (i: number) => [0, 1, 2].map((index) => isOpen(states[i]!, index, 3))
    expect(openAt(0)).toEqual([false, false, false])
    expect(states[1]!.drum).toBe(2)
    expect(openAt(2)).toEqual([false, false, true])
    expect(openAt(4)).toEqual([false, true, true])
    expect(states.at(-1)).toEqual(revealed(3))
  })
})
