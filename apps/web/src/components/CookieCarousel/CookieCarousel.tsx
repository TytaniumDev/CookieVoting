import { rankOf, type CategoryPlaces, type Cookie, type PlatePhoto } from '@cookie-voting/shared'
import { useEffect, useRef } from 'react'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

export interface CookieCarouselProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** In display order; numbered #1…#n. */
  cookies: readonly Cookie[]
  places: CategoryPlaces
  /** Index of the cookie on screen. */
  current: number
  /** Called when a swipe, scroll or arrow moves to another cookie. */
  onCurrentChange: (index: number) => void
  className?: string
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

const arrowClasses =
  'absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface pb-0.5 font-display text-3xl leading-none font-bold text-primary shadow-raised disabled:invisible sm:size-13'

/**
 * One cookie at a time, as big as the space allows. On phones the photo follows a finger
 * sideways and snaps to the next cookie (CSS scroll snap, so it also works with a
 * trackpad or the arrow keys); the arrows step through on any screen. Fill its height
 * by giving it one (e.g. `flex-1` in a column). A medal sits inside the card's corner,
 * never clipped.
 */
export function CookieCarousel({
  photo,
  cookies,
  places,
  current,
  onCurrentChange,
  className = '',
}: CookieCarouselProps) {
  const track = useRef<HTMLDivElement>(null)
  // The cookie the scroll position shows (the first, on mount), so scrolling and
  // `current` don't chase each other.
  const shown = useRef(0)
  // While the arrows or thumbnails scroll to a cookie, the cookies passed on the way
  // aren't reported. Any touch, wheel or key hands control back to the voter.
  const target = useRef<number | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    const el = track.current
    if (!el || shown.current === current) return
    shown.current = current
    target.current = current
    el.scrollTo({ left: current * el.clientWidth, behavior: scrollBehavior() })
  }, [current])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = track.current
      if (!el || el.clientWidth === 0) return
      const index = Math.round(el.scrollLeft / el.clientWidth)
      if (target.current !== null) {
        if (index === target.current) target.current = null
        return
      }
      if (index !== shown.current && index >= 0 && index < cookies.length) {
        shown.current = index
        onCurrentChange(index)
      }
    })
  }

  const voterTakesOver = () => {
    target.current = null
  }

  return (
    <div className={`relative -mx-(--gutter) ${className}`}>
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Cookies"
        // Focusable so the arrow keys scroll it.
        tabIndex={0}
        onScroll={onScroll}
        onPointerDown={voterTakesOver}
        onWheel={voterTakesOver}
        onKeyDown={voterTakesOver}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
      >
        {cookies.map((cookie, index) => {
          const number = index + 1
          const rank = rankOf(places, cookie.id) as Rank | null
          const aspect = (cookie.box.width * photo.width) / (cookie.box.height * photo.height)
          return (
            <div
              key={cookie.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Cookie ${number}`}
              className="grid h-full w-full shrink-0 snap-center snap-always px-(--gutter) py-1.5 sm:px-[calc(var(--gutter)+3.5rem)]"
            >
              <div className="relative grid grid-rows-[minmax(0,1fr)] rounded-card bg-surface p-2 shadow-raised ring-4 ring-accent">
                <div className="grid place-items-center overflow-hidden rounded-control bg-[radial-gradient(circle_at_50%_45%,var(--color-surface)_45%,var(--color-surface-muted))] [container-type:size]">
                  <CookieImage
                    photo={photo}
                    box={cookie.box}
                    alt={`Cookie ${number}`}
                    // As big as fits: the full width, or the full height for tall cookies.
                    style={{ width: `min(100cqw, ${aspect} * 100cqh)` }}
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 left-4 rounded-full bg-primary px-3 font-display text-lg font-bold text-on-primary shadow-card"
                >
                  #{number}
                </span>
                {rank && (
                  <span key={rank} className="absolute top-4 right-4 motion-safe:animate-pop">
                    <RankBadge rank={rank} size="lg" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        aria-label="Previous cookie"
        disabled={current === 0}
        onClick={() => onCurrentChange(current - 1)}
        className={`${arrowClasses} left-1 sm:left-(--gutter)`}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        aria-label="Next cookie"
        disabled={current >= cookies.length - 1}
        onClick={() => onCurrentChange(current + 1)}
        className={`${arrowClasses} right-1 sm:right-(--gutter)`}
      >
        <span aria-hidden="true">›</span>
      </button>
      {cookies.length > 1 && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-full bg-ink/70 px-3 py-0.5 text-sm font-bold whitespace-nowrap text-on-primary pointer-coarse:block motion-safe:animate-hint motion-reduce:pointer-coarse:hidden"
        >
          Swipe for more cookies
        </p>
      )}
    </div>
  )
}
