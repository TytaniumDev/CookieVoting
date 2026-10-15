import { useId, type CSSProperties } from 'react'

export type SpinnerSize = 'sm' | 'md' | 'lg'

/**
 * - `inline`: just the cookie, for inside a button or a line of text.
 * - `section`: centred in its container with the label shown under it, for part of a page.
 * - `screen`: like `section`, but fills the rest of the screen under the app bar, so a
 *   page that is still loading shows the cookie in the middle of the screen.
 */
export type SpinnerLayout = 'inline' | 'section' | 'screen'

export interface SpinnerProps {
  /**
   * Accessible name announced to screen readers, and shown under the cookie in the
   * `section` and `screen` layouts. Pass an empty string when the surrounding element
   * already says it is busy (e.g. a loading button).
   */
  label?: string
  /** Defaults to `sm` inline, `md` in a section and `lg` on a screen. */
  size?: SpinnerSize
  layout?: SpinnerLayout
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-5',
  md: 'size-10',
  lg: 'size-16',
}

const defaultSize: Record<SpinnerLayout, SpinnerSize> = {
  inline: 'sm',
  section: 'md',
  screen: 'lg',
}

const layoutClasses: Record<SpinnerLayout, string> = {
  inline: 'inline-flex',
  section: 'flex flex-col items-center justify-center gap-3 py-8 text-center',
  // The app bar plus the page's vertical padding is about 8rem.
  screen: 'flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-3 text-center',
}

// Transforms in this drawing turn around points in the SVG's own coordinates.
const VIEW_BOX = '[transform-box:view-box]'

/** Each bite is a few overlapping circles cut out of the cookie's edge. */
const bites = [
  {
    origin: 'origin-[40px_9px]',
    circles: [
      [40, 9, 6],
      [44, 15, 5],
      [35, 5, 4.5],
    ],
  },
  {
    origin: 'origin-[43px_33px]',
    circles: [
      [43, 33, 6],
      [38, 39, 5],
      [46, 27, 4],
    ],
  },
  {
    origin: 'origin-[10px_40px]',
    circles: [
      [10, 40, 6],
      [4, 34, 4.5],
      [16, 45, 4.5],
    ],
  },
  {
    origin: 'origin-[7px_10px]',
    circles: [
      [7, 10, 6],
      [13, 5, 4.5],
      [3, 17, 4],
    ],
  },
] as const

/** A crumb falls from each bite as it's taken. */
const crumbs = [
  [40, 14, 3],
  [40, 38, 2],
  [10, 42, -3],
  [8, 14, -2],
] as const

const chips = [
  'M15 15.5c1.4-.8 3 .2 2.8 1.7-.2 1.4-2 2-3 1-.8-.8-.7-2.1.2-2.7z',
  'M27 12c1.3-.5 2.6.6 2.3 1.9-.3 1.2-1.8 1.6-2.7.8-.7-.7-.5-2.3.4-2.7z',
  'M32 24.5c1.5-.5 2.9.8 2.4 2.2-.4 1.2-2.1 1.5-3 .5-.7-.9-.4-2.3.6-2.7z',
  'M20 25c1.2-.6 2.6.3 2.5 1.6-.1 1.3-1.7 1.9-2.6 1-.8-.7-.7-2.1.1-2.6z',
  'M13 30c1.4-.4 2.6.8 2.2 2.1-.4 1.2-2 1.4-2.8.5-.6-.8-.4-2.2.6-2.6z',
  'M25 34c1.3-.5 2.6.5 2.4 1.8-.3 1.3-1.9 1.7-2.8.8-.7-.7-.5-2.2.4-2.6z',
]

/** Bites come one after another round the cookie. */
const BITE_GAP_S = 0.45

/**
 * The loading indicator: someone takes four bites out of a chocolate-chip cookie, crumbs
 * fall, then it pops back whole and the eating starts again. It reads on cream and on the
 * cranberry voter pages alike. Under reduced motion it's a still cookie with one bite out
 * of it, and the label still tells assistive tech that something is loading.
 */
export function Spinner({
  label = 'Loading',
  size,
  layout = 'inline',
  className = '',
}: SpinnerProps) {
  const maskId = `spinner-bites-${useId().replace(/[^\w-]/g, '')}`
  const resolvedSize = size ?? defaultSize[layout]
  const cookie = (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={`shrink-0 overflow-visible ${sizeClasses[resolvedSize]}`}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-4" y="-4" width="56" height="56">
          <rect x="-4" y="-4" width="56" height="56" fill="#fff" />
          {bites.map((bite, i) => (
            <g
              key={i}
              fill="#000"
              // The first bite stays when motion is reduced; the rest only show while animating.
              className={`${VIEW_BOX} ${bite.origin} ${i > 0 ? 'scale-0' : ''} motion-safe:animate-nom-bite`}
              style={{ animationDelay: `${i * BITE_GAP_S}s` }}
            >
              {bite.circles.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          ))}
        </mask>
      </defs>
      <g className={`${VIEW_BOX} origin-[24px_24px] motion-safe:animate-nom-squash`}>
        <g mask={`url(#${maskId})`}>
          <circle
            cx="24"
            cy="24"
            r="20"
            className="fill-dough stroke-gingerbread-shade"
            strokeWidth={resolvedSize === 'sm' ? 3 : 2}
          />
          <g className="fill-ink">
            {chips.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      </g>
      {resolvedSize !== 'sm' &&
        crumbs.map(([cx, cy, dx], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="1.3"
            className="fill-gingerbread opacity-0 motion-safe:animate-nom-crumb"
            style={
              { animationDelay: `${i * BITE_GAP_S}s`, '--crumb-dx': `${dx}px` } as CSSProperties
            }
          />
        ))}
    </svg>
  )
  const showLabel = layout !== 'inline' && label
  return (
    <span role={label ? 'status' : undefined} className={`${layoutClasses[layout]} ${className}`}>
      {cookie}
      {label && <span className={showLabel ? 'font-semibold' : 'sr-only'}>{label}</span>}
    </span>
  )
}
