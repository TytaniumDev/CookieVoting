import { useEffect } from 'react'
import { reportSlow } from '../../lib/monitoring.ts'
import { useTakingLong, TAKING_LONG_MS } from '../../lib/useTakingLong.ts'
import { SlowNotice } from '../SlowNotice/SlowNotice.tsx'
import { Spinner } from '../Spinner/Spinner.tsx'

export interface PageLoadingProps {
  /** What is loading, e.g. "Loading the event". */
  label: string
  /** How long before it offers a reload. */
  slowAfterMs?: number
  /** Defaults to reloading the page. */
  onReload?: () => void
}

/**
 * A page that is still loading: the cookie spinner in the middle of the screen. If it's
 * still there after a while (a phone's connection can stall without failing), it says
 * so and offers a reload, and tells Sentry.
 */
export function PageLoading({
  label,
  slowAfterMs = TAKING_LONG_MS,
  onReload = () => window.location.reload(),
}: PageLoadingProps) {
  const [slow] = useTakingLong(true, slowAfterMs)

  useEffect(() => {
    if (slow) reportSlow(label)
  }, [slow, label])

  if (!slow) return <Spinner layout="screen" label={label} />
  return (
    <div className="space-y-4">
      <SlowNotice title="Still loading" retryLabel="Reload" onRetry={onReload}>
        This is taking longer than it should. Check your connection, then reload.
      </SlowNotice>
      <Spinner layout="section" size="lg" label={label} />
    </div>
  )
}
