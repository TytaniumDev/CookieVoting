import {
  maxPicksFor,
  rankOf,
  toggleRanking,
  type CategoryRanking,
  type Cookie,
  type PlatePhoto,
} from '@cookie-voting/shared'
import { useState } from 'react'
import { CookieCard } from '../CookieCard/CookieCard.tsx'
import { ORDINALS } from '../RankBadge/ordinals.ts'
import { CookieZoom } from '../CookieZoom/CookieZoom.tsx'
import type { Rank } from '../RankBadge/RankBadge.tsx'

export interface CategoryBallotProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** In display order; numbered #1…#n. */
  cookies: readonly Cookie[]
  ranking: CategoryRanking
  onChange: (ranking: CategoryRanking) => void
  className?: string
}

/**
 * Columns that keep every cookie on one screen for typical plates: on a phone, and on
 * wider screens (tablets, laptops, phones held sideways), which are short for their width.
 */
function columnsFor(count: number): string {
  if (count <= 4) return 'grid-cols-2 sm:grid-cols-4'
  if (count <= 9) return 'grid-cols-3 sm:grid-cols-5'
  return 'grid-cols-4 sm:grid-cols-6'
}

/**
 * One category's cookies to rank: tap for 1st, 2nd, 3rd; tap a pick again to remove it
 * and the later picks move up (`toggleRanking`).
 */
export function CategoryBallot({
  photo,
  cookies,
  ranking,
  onChange,
  className = '',
}: CategoryBallotProps) {
  const [zoomedId, setZoomedId] = useState<string | null>(null)
  const maxPicks = maxPicksFor(cookies.length)
  const toggle = (cookieId: string) => onChange(toggleRanking(ranking, cookieId, maxPicks))
  const zoomedIndex = cookies.findIndex((c) => c.id === zoomedId)
  const zoomed = cookies[zoomedIndex]
  const nextRank = ranking.length < maxPicks ? ((ranking.length + 1) as Rank) : null

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-ink-muted" aria-live="polite">
        {ranking.length < maxPicks
          ? `Tap your ${ORDINALS[(ranking.length + 1) as Rank]} favourite. ${ranking.length} of ${maxPicks} picked.`
          : `All ${maxPicks} picked. Tap a pick to change it.`}
      </p>
      <ul className={`grid gap-3 ${columnsFor(cookies.length)}`}>
        {cookies.map((cookie, index) => (
          <li key={cookie.id}>
            <CookieCard
              photo={photo}
              box={cookie.box}
              number={index + 1}
              rank={rankOf(ranking, cookie.id) as Rank | null}
              onToggle={() => toggle(cookie.id)}
              onZoom={() => setZoomedId(cookie.id)}
            />
          </li>
        ))}
      </ul>
      <CookieZoom
        cookie={zoomed ? { photo, box: zoomed.box, number: zoomedIndex + 1 } : null}
        rank={zoomed ? (rankOf(ranking, zoomed.id) as Rank | null) : null}
        nextRank={nextRank}
        onToggle={() => {
          if (zoomed) toggle(zoomed.id)
          setZoomedId(null)
        }}
        onClose={() => setZoomedId(null)}
      />
    </div>
  )
}
