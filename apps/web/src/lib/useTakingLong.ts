import { useCallback, useEffect, useState } from 'react'

/** How long a save or a load runs before the page offers a retry. */
export const TAKING_LONG_MS = 10_000

/**
 * Whether `busy` has been true for `ms` without a break, so the page can say so and offer
 * a retry instead of spinning forever. `restart` starts the wait again (after a retry).
 */
export function useTakingLong(busy: boolean, ms = TAKING_LONG_MS): [boolean, () => void] {
  // Each stretch of being busy, and each restart, is a new attempt with its own timer.
  const [attempt, setAttempt] = useState(0)
  const [lateAttempt, setLateAttempt] = useState<number | null>(null)
  const [wasBusy, setWasBusy] = useState(busy)
  if (busy !== wasBusy) {
    setWasBusy(busy)
    if (busy) setAttempt((a) => a + 1)
  }

  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setLateAttempt(attempt), ms)
    return () => clearTimeout(timer)
  }, [busy, attempt, ms])

  const restart = useCallback(() => setAttempt((a) => a + 1), [])
  return [busy && lateAttempt === attempt, restart]
}
