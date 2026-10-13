import { useEffect, useState } from 'react'

export type Subscription<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: Error }

/** Starts a listener and returns the function that stops it (e.g. Firestore's `onSnapshot`). */
export type Subscribe<T> = (
  onData: (data: T) => void,
  onError: (error: Error) => void,
) => () => void

const loading = { status: 'loading' } as const

/**
 * Keeps a realtime listener open while the component is mounted and returns its latest
 * value. The listener restarts when `key` changes and always stops on unmount, so pages
 * never leak Firestore reads (PRD §14). Pass `null` to subscribe to nothing.
 */
export function useSubscription<T>(subscribe: Subscribe<T> | null, key: string): Subscription<T> {
  const [state, setState] = useState<{ key: string; value: Subscription<T> }>({
    key,
    value: loading,
  })

  useEffect(() => {
    if (!subscribe) return
    return subscribe(
      (data) => setState({ key, value: { status: 'ready', data } }),
      (error) => setState({ key, value: { status: 'error', error } }),
    )
    // `key` identifies the subscription; `subscribe` is usually a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Until the new listener reports, don't show the previous key's data.
  return subscribe && state.key === key ? state.value : loading
}
