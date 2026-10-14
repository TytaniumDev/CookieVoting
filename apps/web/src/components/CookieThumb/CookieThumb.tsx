import type { Cookie, PlatePhoto } from '@cookie-voting/shared'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { RankBadge, type Rank, type RankBadgeSize } from '../RankBadge/RankBadge.tsx'

export interface CookieThumbProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  cookie: Cookie
  /** Describes the cookie, e.g. "Cookie 3"; '' when a label beside it already does. */
  alt: string
  /** The voter's medal on it, shown on the top-left corner. */
  rank?: Rank
  badgeSize?: RankBadgeSize
  /** A circle (the festive results) instead of a rounded square. */
  round?: boolean
  /** Sets the size, e.g. `w-20`. */
  className?: string
}

/** One cookie as a small square (or round) photo, fitted inside, with an optional medal. */
export function CookieThumb({
  photo,
  cookie,
  alt,
  rank,
  badgeSize = 'md',
  round = false,
  className = '',
}: CookieThumbProps) {
  const aspect = (cookie.box.width * photo.width) / (cookie.box.height * photo.height)
  return (
    <span className={`relative block ${className}`}>
      <span
        className={`grid aspect-square place-items-center overflow-hidden ${
          round
            ? 'rounded-full bg-[radial-gradient(circle_at_50%_45%,var(--color-surface)_45%,var(--color-surface-muted))]'
            : 'rounded-control bg-surface-muted'
        }`}
      >
        <CookieImage
          photo={photo}
          box={cookie.box}
          alt={alt}
          style={{ width: `${Math.min(1, aspect) * 100}%` }}
        />
      </span>
      {rank && <RankBadge rank={rank} size={badgeSize} className="absolute -top-2 -left-2" />}
    </span>
  )
}
