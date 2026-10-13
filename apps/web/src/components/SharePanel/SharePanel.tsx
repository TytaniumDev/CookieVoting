import { useEffect, useState } from 'react'
import { Button } from '../Button/Button.tsx'
import { QrCode } from '../QrCode/QrCode.tsx'

export interface SharePanelProps {
  /** The voter link. */
  url: string
  /** Shown in the phone's share sheet, e.g. the event name. */
  title: string
  /** Show the QR code (big screens and the event page); the dashboard leaves it out. */
  showQrCode?: boolean
  className?: string
}

/**
 * The voter link with Copy, the phone's Share sheet where there is one, and a QR code
 * people can scan from the admin's screen.
 */
export function SharePanel({ url, title, showQrCode = true, className = '' }: SharePanelProps) {
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(null), 2500)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied('yes')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="rounded-control bg-surface-muted px-3 py-2 font-bold break-all text-ink">
        {url}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => void copy()}>
          Copy link
        </Button>
        {canShare && (
          <Button
            variant="ghost"
            onClick={() => void navigator.share({ title, url }).catch(() => {})}
          >
            Share…
          </Button>
        )}
        <span role="status" className="text-sm text-ink-muted">
          {copied === 'yes'
            ? 'Copied!'
            : copied === 'failed'
              ? 'Copy failed; select the link instead.'
              : ''}
        </span>
      </div>
      {showQrCode && (
        <QrCode value={url} label={`QR code for ${url}`} className="mx-auto w-full max-w-64" />
      )}
    </div>
  )
}
