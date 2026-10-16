/**
 * A short buzz to confirm a tap, e.g. giving a medal. Android browsers only: iOS Safari
 * has no vibration API, so this does nothing there.
 */
export function buzz(ms = 15) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
}
