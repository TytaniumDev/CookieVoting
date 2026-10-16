import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ordinal } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'
import { GARLAND_PATH, layoutOrnaments } from './layout.ts'
import { isOpen, type RevealState } from './reveal.ts'

export interface OrnamentItem {
  id: string
  /** Competition rank: ties share one. */
  rank: number
  tied: boolean
  /** On the gift tag, e.g. the baker. */
  name: string
  /** Under the name, e.g. "40 pts". */
  detail: string
  /** Fills the ball, e.g. a round `CookieThumb`. */
  picture: ReactNode
}

export interface OrnamentsProps {
  /** Up to three, in place order (1st first). */
  items: readonly OrnamentItem[]
  /** Which are open; see `useReveal`. */
  reveal: RevealState
  /** Lower the ornaments on unrolling strings as they drop (the first time only). */
  animate?: boolean
  /** Makes open ornaments buttons, e.g. to show a cookie's votes. */
  onSelect?: (id: string) => void
  /** What tapping an ornament does, for screen readers. */
  selectHint?: string
  className?: string
}

const ringClasses: Record<Rank, string> = {
  1: 'ring-rank-1 shadow-[0_0_36px_8px_color-mix(in_srgb,var(--color-glow)_55%,transparent)]',
  2: 'ring-rank-2 shadow-raised',
  3: 'ring-rank-3 shadow-raised',
}

// The closed ornament: pine green with gold stripes and a highlight.
const coverStyle: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--color-snow) 55%, transparent) 0 9%, transparent 22%), repeating-linear-gradient(-35deg, transparent 0 18px, color-mix(in srgb, var(--color-accent) 55%, transparent) 18px 24px)',
}

// Each ornament starts unrolling a moment after the one before (2nd, 3rd, then 1st).
const DROP_DELAY = [0.3, 0, 0.15]

/** Keeps the size of an element in state. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

/**
 * A category's winners as ornaments hanging from a garland (owner decision 2026-10-14):
 * 1st biggest and lowest in the middle, 2nd and 3rd either side, each with a gift tag.
 * Closed ornaments hide who placed until the timed reveal opens them. Strings start on
 * the garland's curve. Fill a space with it; it lays itself out for tall or wide.
 */
export function Ornaments({
  items,
  reveal,
  animate = false,
  onSelect,
  selectHint = 'See its votes',
  className = '',
}: OrnamentsProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const layout = layoutOrnaments(width, height, items.length, {
    first: items[0]?.tied,
    sides: items.slice(1).some((item) => item.tied),
  })

  return (
    <div ref={ref} className={`relative ${reveal.dropped ? '' : 'invisible'} ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 w-full overflow-visible"
        style={{ height: layout.garlandHeight }}
      >
        <path
          d={GARLAND_PATH}
          fill="none"
          strokeWidth={9}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-secondary"
        />
        <path
          d={GARLAND_PATH}
          fill="none"
          strokeWidth={2}
          strokeDasharray="2 10"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-accent"
        />
      </svg>
      {width > 0 &&
        // Drawn 2nd, 3rd, then 1st, so the winner hangs in front.
        [1, 2, 0].map((index) => {
          const item = items[index]
          const spot = layout.ornaments[index]
          if (!item || !spot) return null
          const open = isOpen(reveal, index, items.length)
          const rank = Math.min(item.rank, 3) as Rank
          const delay = `${DROP_DELAY[index]}s`
          const label = `${item.name}, ${item.tied ? 'tied ' : ''}${ordinal(item.rank)} place, ${item.detail}`
          const ball = (
            <>
              {item.picture}
              {open && (
                <RankBadge
                  rank={rank}
                  className="absolute -right-0.5 -bottom-0.5 motion-safe:animate-pop"
                />
              )}
              {open && item.rank === 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl leading-none motion-safe:animate-bob"
                >
                  👑
                </span>
              )}
              <span
                aria-hidden="true"
                style={{ ...coverStyle, fontSize: spot.size * 0.25 }}
                className={`absolute inset-0 grid place-items-center rounded-full bg-secondary font-display font-bold text-accent-subtle shadow-[inset_-10px_-14px_0_color-mix(in_srgb,var(--color-ink)_18%,transparent)] transition-[transform,opacity] duration-500 ${
                  open ? 'pointer-events-none scale-150 opacity-0' : ''
                } ${reveal.drum === index ? 'motion-safe:animate-drumroll' : ''}`}
              >
                ?
              </span>
            </>
          )
          const ballClasses = `relative block shrink-0 rounded-full bg-surface p-1.5 ring-5 transition-[box-shadow,transform] ${
            open ? ringClasses[rank] : 'shadow-raised ring-accent'
          } ${animate ? 'motion-safe:animate-appear' : ''}`
          return (
            <div
              key={item.id}
              className="absolute flex origin-top flex-col items-center motion-safe:animate-swing"
              style={{
                left: spot.x - spot.size / 2,
                top: spot.hookY - 4,
                width: spot.size,
                animationDelay: `${-index * 1.1}s`,
              }}
            >
              <span
                aria-hidden="true"
                className="relative z-1 -mb-1 size-2 rounded-full bg-accent ring-2 ring-secondary"
              />
              <span
                aria-hidden="true"
                className={`w-0.5 bg-accent-subtle ${animate ? 'motion-safe:animate-unspool' : ''}`}
                style={{
                  height: Math.max(spot.ballTop - spot.hookY - 12, 4),
                  animationDelay: delay,
                }}
              />
              <span
                aria-hidden="true"
                className={`relative z-1 -mb-1 h-3.5 w-1/4 rounded-t-sm bg-accent ${animate ? 'motion-safe:animate-appear' : ''}`}
                style={{ animationDelay: delay }}
              />
              {open && onSelect ? (
                <button
                  type="button"
                  aria-label={`${label}. ${selectHint}`}
                  onClick={() => onSelect(item.id)}
                  className={`${ballClasses} hover:scale-104`}
                  style={{ width: spot.size, height: spot.size, animationDelay: delay }}
                >
                  {ball}
                </button>
              ) : (
                <span
                  role="img"
                  aria-label={open ? label : 'Not revealed yet'}
                  className={ballClasses}
                  style={{ width: spot.size, height: spot.size, animationDelay: delay }}
                >
                  {ball}
                </span>
              )}
              {/*
                One line each, so the tag is as tall as the layout keeps free; wider than the
                ball if it needs to be, but never past the edge of the area.
              */}
              <span
                aria-hidden="true"
                style={{ maxWidth: Math.min(160, 2 * Math.min(spot.x, width - spot.x) - 8) }}
                className={`mt-2.5 w-max rounded-[0.625rem] bg-surface px-2.5 pt-0.5 pb-1 text-center text-ink shadow-card transition duration-500 ${
                  open ? '' : '-translate-y-3 opacity-0'
                }`}
              >
                <span
                  className={`block truncate font-display font-semibold ${index === 0 ? 'text-2xl text-primary' : 'text-lg'}`}
                >
                  {item.name}
                </span>
                <span className="block truncate text-sm font-bold text-ink-muted">
                  {item.detail}
                </span>
                {item.tied && (
                  <span className="block truncate text-xs font-extrabold tracking-wide text-primary uppercase">
                    Tied {ordinal(item.rank)}
                  </span>
                )}
              </span>
            </div>
          )
        })}
    </div>
  )
}
