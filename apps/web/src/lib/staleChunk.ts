/**
 * After a deploy, a tab opened earlier still asks for the old build's lazy chunks, which
 * Hosting no longer has. A fresh page load picks up the new build, so we reload once.
 */

const RELOADED_AT_KEY = 'stale-chunk-reloaded-at'
/** A second failure this soon after our reload means reloading won't help. */
const RETRY_WINDOW_MS = 30_000

// Chrome, Firefox and Safari word the failure differently.
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message)
}

/**
 * Reloads the page unless we already did so moments ago. Returns whether it reloaded, so
 * callers can show an error instead of looping.
 */
export function reloadOnce(
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = safeSessionStorage(),
  reload: () => void = () => window.location.reload(),
  now: number = Date.now(),
): boolean {
  const last = Number(storage?.getItem(RELOADED_AT_KEY) ?? 0)
  if (now - last < RETRY_WINDOW_MS) return false
  try {
    storage?.setItem(RELOADED_AT_KEY, String(now))
  } catch {
    // Storage full or blocked: still worth one reload.
  }
  reload()
  return true
}

/**
 * Runs a lazy route's import. If the chunk is gone after a deploy, reloads instead and
 * never settles, so the router keeps its loading state until the new build takes over.
 * Any other failure, or a stale chunk we already reloaded for, goes to the error page.
 */
export async function loadChunk<T>(
  load: () => Promise<T>,
  reload = () => reloadOnce(),
): Promise<T> {
  try {
    return await load()
  } catch (error) {
    if (isChunkLoadError(error) && reload()) return new Promise<never>(() => {})
    throw error
  }
}

/** Vite fires this when a lazy chunk's CSS or JS dependencies fail to preload. */
export function listenForStaleChunks() {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) event.preventDefault()
  })
}

function safeSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}
