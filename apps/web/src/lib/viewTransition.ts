import { flushSync } from 'react-dom'

/**
 * Runs a state change that swaps the page's content (e.g. the next ballot category) as a
 * view transition: a quick crossfade where supported (Safari 18+, Chrome), an instant swap
 * elsewhere. Reduced motion turns the animation off in index.css.
 */
export function withViewTransition(update: () => void) {
  if (typeof document === 'undefined' || !document.startViewTransition) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
