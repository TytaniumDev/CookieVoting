import type { PlaceVotes } from '@cookie-voting/shared'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ordinal } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'
import { popupClasses, popupStyle } from '../../lib/popupStyle.ts'
import { useSwipeToClose } from '../../lib/useSwipeToClose.ts'

export interface VoteBreakdownProps {
  /** Shown while set; `null` closes it. */
  cookie: {
    /** A round picture of the cookie, e.g. a round `CookieThumb`. */
    picture: ReactNode
    /** The baker's name, or "No baker". */
    name: string
    category: string
    rank: number
    tied: boolean
    points: number
    votes: PlaceVotes
    /** Voters who voted in the category, so the rest left this cookie out of their top 3. */
    voters: number
  } | null
  onClose: () => void
}

const PLACES = [
  { rank: 1, points: 3, fill: 'bg-rank-1' },
  { rank: 2, points: 2, fill: 'bg-rank-2' },
  { rank: 3, points: 1, fill: 'bg-rank-3' },
] as const

const ringClasses: Record<Rank, string> = {
  1: 'ring-rank-1 shadow-[0_0_28px_4px_color-mix(in_srgb,var(--color-glow)_55%,transparent)]',
  2: 'ring-rank-2',
  3: 'ring-rank-3',
}

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`
const votesText = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`

/**
 * One cookie's votes (owner decision 2026-10-14): how many voters put it 1st, 2nd and 3rd,
 * how many left it out of their top 3, and the points each place earned. A modal on the
 * native `<dialog>`, so focus trapping, Escape and the backdrop come from the browser.
 */
export function VoteBreakdown({ cookie, onClose }: VoteBreakdownProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const open = cookie !== null
  const [style] = useState(popupStyle)
  useSwipeToClose(ref, onClose, style !== 'card')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const placed = cookie ? cookie.votes[0] + cookie.votes[1] + cookie.votes[2] : 0
  const left = cookie ? Math.max(cookie.voters - placed, 0) : 0
  const share = (n: number) => `${cookie && cookie.voters > 0 ? (n / cookie.voters) * 100 : 0}%`

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={popupClasses(style)}
    >
      {cookie && (
        <div className="relative grid gap-3 p-5">
          {style === 'sheet' && (
            <span
              aria-hidden="true"
              className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-border"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full bg-surface-muted text-lg font-extrabold"
          >
            <span aria-hidden="true">✕</span>
          </button>
          <div className="flex items-center gap-4 pr-10">
            <span
              className={`relative block size-28 shrink-0 rounded-full bg-surface p-1 ring-5 sm:size-33 ${
                cookie.rank <= 3 ? ringClasses[cookie.rank as Rank] : 'ring-border'
              }`}
            >
              {cookie.picture}
              {cookie.rank <= 3 && (
                <RankBadge rank={cookie.rank as Rank} className="absolute -right-1 -bottom-1" />
              )}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-3xl text-primary">
                {cookie.name}
              </h2>
              <p className="font-bold text-ink-muted">
                {cookie.category} · {cookie.tied ? 'Tied ' : ''}
                {ordinal(cookie.rank)} place
              </p>
              <p className="font-display text-xl font-bold">{pts(cookie.points)}</p>
            </div>
          </div>
          <h3 className="mt-1 font-sans text-sm font-extrabold tracking-wider text-ink-muted uppercase">
            How the {cookie.voters} {cookie.voters === 1 ? 'voter' : 'voters'} ranked it
          </h3>
          <ul className="grid gap-2.5">
            {PLACES.map(({ rank, points, fill }, i) => {
              const n = cookie.votes[i] ?? 0
              return (
                <Row
                  key={rank}
                  badge={<RankBadge rank={rank} size="sm" />}
                  label={`${ordinal(rank)} place`}
                  count={n}
                  width={share(n)}
                  fill={fill}
                  note={`${n} × ${points} = ${pts(n * points)}`}
                />
              )
            })}
            <Row
              badge={
                <span
                  aria-hidden="true"
                  className="grid size-6 place-items-center rounded-full bg-surface-muted font-bold text-ink-muted"
                >
                  –
                </span>
              }
              label="Not in their top 3"
              count={left}
              width={share(left)}
              fill="bg-border"
              note="No points"
            />
          </ul>
        </div>
      )}
    </dialog>
  )
}

function Row({
  badge,
  label,
  count,
  width,
  fill,
  note,
}: {
  badge: ReactNode
  label: string
  count: number
  width: string
  fill: string
  note: string
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1">
      <span className="row-span-3 self-start">{badge}</span>
      <span className="font-extrabold">{label}</span>
      <span className="font-display font-bold tabular-nums">{votesText(count)}</span>
      <span className="col-span-2 h-3 overflow-hidden rounded-full bg-surface-muted">
        <span
          className={`block h-full rounded-full motion-safe:animate-fill ${fill}`}
          style={{ width }}
        />
      </span>
      <span className="col-span-2 text-sm font-bold text-ink-muted">{note}</span>
    </li>
  )
}
