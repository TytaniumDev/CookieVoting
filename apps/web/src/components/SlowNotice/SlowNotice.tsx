import type { ReactNode } from 'react'
import { Alert } from '../Alert/Alert.tsx'
import { Button } from '../Button/Button.tsx'

export interface SlowNoticeProps {
  title: string
  children: ReactNode
  /** Defaults to "Try again". */
  retryLabel?: string
  onRetry: () => void
  /** Shows a spinner on the button while the retry runs. */
  retrying?: boolean
  className?: string
}

/**
 * Says that a save or a load is taking far too long and offers a retry, so a stalled
 * connection never leaves someone watching a spinner with nothing to do.
 */
export function SlowNotice({
  title,
  children,
  retryLabel = 'Try again',
  onRetry,
  retrying = false,
  className = '',
}: SlowNoticeProps) {
  return (
    <Alert tone="warning" title={title} className={className}>
      <p>{children}</p>
      <Button variant="secondary" className="mt-3" loading={retrying} onClick={onRetry}>
        {retryLabel}
      </Button>
    </Alert>
  )
}
