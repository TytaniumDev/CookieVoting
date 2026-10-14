import type { ReactNode } from 'react'
import { ordinal } from '../RankBadge/ordinals.ts'
import { RankBadge } from '../RankBadge/RankBadge.tsx'

export interface StandingRowProps {
  /** Competition rank: ties share a rank (1, 2, 2, 4). */
  rank: number
  /** Whether another entry shares this rank. */
  tied: boolean
  /** The main line, e.g. the baker's name. */
  title: string
  /** A smaller second line, e.g. which cookie it was. */
  subtitle?: string
  points: number
  /** Shown between the place and the title, e.g. the cookie. */
  image?: ReactNode
  /** Makes the row a button, e.g. to show the cookie's votes. */
  onSelect?: () => void
  /** What the button does, for screen readers, e.g. "See its votes". */
  selectHint?: string
}

/**
 * One line of a results table: place, optional picture, name and Borda points.
 * The top three places get their medal; ties share a place (PRD §9).
 */
export function StandingRow({
  rank,
  tied,
  title,
  subtitle,
  points,
  image,
  onSelect,
  selectHint,
}: StandingRowProps) {
  const content = (
    <>
      {rank <= 3 ? (
        <RankBadge rank={rank as 1 | 2 | 3} className="shrink-0" />
      ) : (
        <span
          role="img"
          aria-label={`${ordinal(rank)} place`}
          className="inline-grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted font-display font-bold text-ink-muted"
        >
          <span aria-hidden="true">{rank}</span>
        </span>
      )}
      {image}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{title}</span>
        {(subtitle || tied) && (
          <span className="block text-sm text-ink-muted">
            {subtitle}
            {subtitle && tied && ' · '}
            {tied && `Tied ${ordinal(rank)}`}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right font-display text-lg font-bold">
        {points}
        <span aria-hidden="true" className="text-sm font-normal text-ink-muted">
          {' '}
          {points === 1 ? 'pt' : 'pts'}
        </span>
        <span className="sr-only"> {points === 1 ? 'point' : 'points'}</span>
      </span>
    </>
  )
  if (!onSelect) return <li className="flex min-h-14 items-center gap-3 py-2">{content}</li>
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-control px-2 py-2 text-left hover:bg-surface-muted"
      >
        {content}
        {selectHint && <span className="sr-only">. {selectHint}</span>}
        <span aria-hidden="true" className="-ml-1 font-display text-xl font-bold text-ink-muted">
          ›
        </span>
      </button>
    </li>
  )
}
