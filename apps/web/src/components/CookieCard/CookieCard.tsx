import type { Box, PlatePhoto } from '@cookie-voting/shared'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { ORDINALS } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

export interface CookieCardProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  box: Box
  /** The cookie's number on its plate (#1…#n). */
  number: number
  /** The voter's pick for this cookie, or null. */
  rank: Rank | null
  onToggle: () => void
  onZoom: () => void
  className?: string
}

/**
 * A cookie on the voting grid: tap it to rank it (or unrank it), or 🔍 to see it big.
 * The cookie is fitted inside a square so every card in the grid is the same size.
 */
export function CookieCard({
  photo,
  box,
  number,
  rank,
  onToggle,
  onZoom,
  className = '',
}: CookieCardProps) {
  const aspect = (box.width * photo.width) / (box.height * photo.height)
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-pressed={rank !== null}
        aria-label={rank ? `Cookie ${number}, your ${ORDINALS[rank]} pick` : `Cookie ${number}`}
        onClick={onToggle}
        className={`block w-full rounded-card border-4 bg-surface p-1 shadow-card transition-colors ${
          rank ? 'border-primary' : 'border-transparent'
        }`}
      >
        <span className="grid aspect-square place-items-center overflow-hidden rounded-control bg-surface-muted">
          <CookieImage
            photo={photo}
            box={box}
            alt=""
            className="rounded-control"
            // Wide cookies fill the width; tall ones fill the height.
            style={{ width: `${Math.min(1, aspect) * 100}%` }}
          />
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-2 rounded-full bg-surface px-2 font-display text-sm font-bold text-ink shadow-card"
        >
          #{number}
        </span>
      </button>
      {rank && <RankBadge rank={rank} className="pointer-events-none absolute -top-2 -right-2" />}
      <button
        type="button"
        aria-label={`See cookie ${number} up close`}
        onClick={onZoom}
        className="absolute right-1 bottom-1 grid size-11 place-items-center rounded-full text-lg"
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-surface shadow-card"
        >
          🔍
        </span>
      </button>
    </div>
  )
}
