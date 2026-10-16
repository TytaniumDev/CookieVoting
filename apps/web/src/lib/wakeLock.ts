import { useEffect } from 'react'

/**
 * Keeps the screen on while `active` (Screen Wake Lock API: Safari 16.4+, Chrome), e.g. a
 * phone or TV showing the results reveal. Browsers drop the lock when the page is hidden,
 * so it's taken again when the page comes back. A no-op where unsupported.
 */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false
    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (stopped) void next.release()
        else lock = next
      } catch {
        // Refused (battery saver, no user activation yet): the screen just sleeps as usual.
      }
    }
    const onVisible = () => void request()
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [active])
}
