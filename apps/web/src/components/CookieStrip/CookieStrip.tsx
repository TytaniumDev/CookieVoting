import { rankOf, type CategoryPlaces, type Cookie, type PlatePhoto } from '@cookie-voting/shared'
import { useEffect, useRef } from 'react'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { ORDINALS } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

export interface CookieStripProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** In display order. Screen readers number them 1…n; no number is shown. */
  cookies: readonly Cookie[]
  places: CategoryPlaces
  /** Index of the cookie on screen. */
  current: number
  onSelect: (index: number) => void
  className?: string
}

/**
 * Every cookie on the plate as a small photo, with the medals given so far. Tapping one
 * shows it. Like `Stepper`, one centred row that scrolls sideways, edge to edge, only
 * when it doesn't fit, keeping the cookie on screen in view. Room above the row keeps
 * the medals from being clipped.
 */
export function CookieStrip({
  photo,
  cookies,
  places,
  current,
  onSelect,
  className = '',
}: CookieStripProps) {
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = row.current
    const shown = strip?.querySelector<HTMLElement>('[aria-current]')
    if (!strip || !shown) return
    const start = shown.offsetLeft - strip.scrollLeft
    const end = start + shown.offsetWidth
    const gutter = parseFloat(getComputedStyle(strip).paddingLeft)
    if (start < gutter || end > strip.clientWidth - gutter) {
      strip.scrollTo({ left: shown.offsetLeft - gutter, behavior: 'smooth' })
    }
  }, [current])

  return (
    <div
      ref={row}
      className={`relative -mx-(--gutter) overflow-x-auto px-(--gutter) pt-3 pb-1 [scrollbar-width:none] ${className}`}
    >
      <ul className="mx-auto flex w-max gap-2 sm:gap-3">
        {cookies.map((cookie, index) => {
          const number = index + 1
          const rank = rankOf(places, cookie.id) as Rank | null
          const isShown = index === current
          const aspect = (cookie.box.width * photo.width) / (cookie.box.height * photo.height)
          return (
            <li key={cookie.id}>
              <button
                type="button"
                aria-current={isShown ? 'true' : undefined}
                aria-label={`Show cookie ${number}${rank ? `, your ${ORDINALS[rank]} place` : ''}`}
                onClick={() => onSelect(index)}
                className={`relative block size-13 rounded-control bg-surface transition-[transform,box-shadow] sm:size-15 ${
                  isShown ? '-translate-y-1 ring-3 ring-accent' : 'ring-2 ring-primary-hover'
                }`}
              >
                <span className="grid size-full place-items-center overflow-hidden rounded-control">
                  <CookieImage
                    photo={photo}
                    box={cookie.box}
                    alt=""
                    style={{ width: `${Math.min(1, aspect) * 100}%` }}
                  />
                </span>
                {rank && (
                  <span aria-hidden="true" className="absolute -top-2 -right-2">
                    <RankBadge rank={rank} size="sm" />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
