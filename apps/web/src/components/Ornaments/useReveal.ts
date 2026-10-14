import { useEffect, useRef, useState } from 'react'
import {
  applyStep,
  CELEBRATE_MS,
  DROPPED,
  revealed,
  revealSteps,
  type RevealState,
} from './reveal.ts'

/** `wait`: not seen yet (hidden). `play`: on screen for the first time. `done`: all open. */
export type RevealMode = 'wait' | 'play' | 'done'

const HIDDEN: RevealState = { dropped: false, opened: 0, drum: null }

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs the timed reveal for `count` ornaments while `mode` is `play`, and calls `onDone`
 * a moment after the winner opens. With reduced motion everything is open at once.
 */
export function useReveal(count: number, mode: RevealMode, onDone: () => void): RevealState {
  // Each slide plays once, so the reveal can start from the dropped state.
  const [state, setState] = useState<RevealState>(DROPPED)
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    if (mode !== 'play') return
    if (prefersReducedMotion() || count === 0) {
      done.current()
      return
    }
    const steps = revealSteps(count)
    const timers = steps.map((step) =>
      window.setTimeout(() => setState((s) => applyStep(s, step)), step.at),
    )
    timers.push(window.setTimeout(() => done.current(), steps.at(-1)!.at + CELEBRATE_MS))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [mode, count])

  if (mode === 'done') return revealed(count)
  if (mode === 'wait') return HIDDEN
  return state
}
