import { useEffect, useState } from 'react'
import type { CookieFinder } from './cookieFinder.ts'

export type CookieFinderState =
  { status: 'loading' } | { status: 'ready'; finder: CookieFinder } | { status: 'unavailable' }

// One model per page load, shared by every plate.
let loading: Promise<CookieFinder> | null = null

function load(): Promise<CookieFinder> {
  loading ??= import('./cookieFinder.ts').then((m) => m.createCookieFinder())
  loading.catch(() => {
    // Let a later visit try again (e.g. after the connection comes back).
    loading = null
  })
  return loading
}

/**
 * Loads tap-to-select in the background. If it can't load (old phone, offline, blocked
 * download), the state is `unavailable` and the plate editor falls back to drawing.
 */
export function useCookieFinder(): CookieFinderState {
  const [state, setState] = useState<CookieFinderState>({ status: 'loading' })
  useEffect(() => {
    let active = true
    load().then(
      (finder) => active && setState({ status: 'ready', finder }),
      (error: unknown) => {
        console.warn('Tap-to-select is unavailable', error)
        if (active) setState({ status: 'unavailable' })
      },
    )
    return () => {
      active = false
    }
  }, [])
  return state
}
