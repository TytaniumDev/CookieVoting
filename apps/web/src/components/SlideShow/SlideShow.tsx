import { useEffect, useRef, type ReactNode } from 'react'

export interface Slide {
  id: string
  /** On its tab, e.g. the category's name. */
  label: string
  content: ReactNode
}

export interface SlideShowProps {
  slides: readonly Slide[]
  /** Index of the slide on screen. */
  current: number
  /** Called when a swipe, tab or arrow moves to another slide. */
  onCurrentChange: (index: number) => void
  /** Names the slide show for screen readers, e.g. "Results". */
  label: string
  className?: string
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

const arrowClasses =
  'absolute top-1/2 z-10 hidden size-13 -translate-y-1/2 place-items-center rounded-full bg-surface pb-0.5 font-display text-3xl leading-none font-bold text-primary shadow-raised disabled:invisible sm:grid'

/**
 * Full-width slides that follow a finger sideways and snap (CSS scroll snap), with a row
 * of tabs above, one per slide, and arrows beside on wider screens. Meant for a
 * brand-coloured backdrop. Give it a height; the slides take what the tabs leave.
 */
export function SlideShow({
  slides,
  current,
  onCurrentChange,
  label,
  className = '',
}: SlideShowProps) {
  const track = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLElement>(null)
  // The slide the scroll position shows, so scrolling and `current` don't chase each other.
  const shown = useRef(0)
  // While a tab or arrow scrolls to a slide, the slides passed on the way aren't reported.
  const target = useRef<number | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    const el = track.current
    if (!el || shown.current === current) return
    shown.current = current
    target.current = current
    el.scrollTo({ left: current * el.clientWidth, behavior: scrollBehavior() })
  }, [current])

  // Keep the current tab in view, like `PlateTabs`.
  useEffect(() => {
    const row = tabs.current
    const tab = row?.querySelector<HTMLElement>('[aria-current]')
    if (!row || !tab) return
    const start = tab.offsetLeft - row.scrollLeft
    const end = start + tab.offsetWidth
    const gutter = parseFloat(getComputedStyle(row).paddingLeft)
    if (start < gutter || end > row.clientWidth - gutter) {
      row.scrollTo({
        left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
        behavior: scrollBehavior(),
      })
    }
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
      if (index !== shown.current && index >= 0 && index < slides.length) {
        shown.current = index
        onCurrentChange(index)
      }
    })
  }

  const userTakesOver = () => {
    target.current = null
  }

  return (
    <div className={`flex min-h-0 flex-col gap-1 ${className}`}>
      <nav
        ref={tabs}
        aria-label={label}
        className="-mx-(--gutter) overflow-x-auto px-(--gutter) py-1 [scrollbar-width:none]"
      >
        <ul className="mx-auto flex w-max gap-1.5">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                aria-current={index === current ? 'true' : undefined}
                onClick={() => onCurrentChange(index)}
                className={`min-h-11 rounded-full px-3.5 text-sm font-extrabold whitespace-nowrap transition-colors sm:text-base ${
                  index === current
                    ? 'bg-accent text-on-accent'
                    : 'bg-primary-hover text-primary-subtle hover:text-on-primary'
                }`}
              >
                {slide.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="relative -mx-(--gutter) min-h-0 flex-1">
        <div
          ref={track}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          // Focusable so the arrow keys scroll it.
          tabIndex={0}
          onScroll={onScroll}
          onPointerDown={userTakesOver}
          onWheel={userTakesOver}
          onKeyDown={userTakesOver}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={slide.label}
              // Off-screen slides stay out of the tab order and the accessibility tree.
              inert={index !== current}
              className="flex h-full w-full shrink-0 snap-center snap-always flex-col px-(--gutter) sm:px-[calc(var(--gutter)+3.5rem)]"
            >
              {slide.content}
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Previous"
          disabled={current === 0}
          onClick={() => onCurrentChange(current - 1)}
          className={`${arrowClasses} left-(--gutter)`}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={current >= slides.length - 1}
          onClick={() => onCurrentChange(current + 1)}
          className={`${arrowClasses} right-(--gutter)`}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}
