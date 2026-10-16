import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { BottomSheet } from '../BottomSheet/BottomSheet.tsx'
import { ordinal } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

export interface BakerBreakdownCookie {
  /** Unique within the baker, e.g. the cookie id. */
  id: string
  category: string
  /** Its rank in the category, and whether another cookie shares it. */
  rank: number
  tied: boolean
  /** How many cookies the category has, for "2nd of 5". */
  categorySize: number
  points: number
  /** A round picture of the cookie, e.g. a round `CookieThumb`. */
  picture: ReactNode
  /** Makes the row a button that shows the cookie's votes. */
  onSelect?: () => void
}

export interface BakerBreakdownProps {
  /** Shown while set; `null` closes it. */
  baker: {
    name: string
    rank: number
    tied: boolean
    /** How many bakers there are, for "2nd of 8 bakers". */
    bakers: number
    points: number
    /** The baker's best cookie, round. */
    picture: ReactNode
    /** Best first. Their points add up to `points`. */
    cookies: readonly BakerBreakdownCookie[]
  } | null
  onClose: () => void
}

// One colour per cookie on the points bar, repeating after six.
const SWATCHES = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-gingerbread)',
  'var(--color-rank-2)',
  'var(--color-ink-muted)',
]
const swatch = (i: number) => SWATCHES[i % SWATCHES.length]!

const ringClasses: Record<Rank, string> = {
  1: 'ring-rank-1 shadow-[0_0_28px_4px_color-mix(in_srgb,var(--color-glow)_55%,transparent)]',
  2: 'ring-rank-2',
  3: 'ring-rank-3',
}
const thumbRing: Record<Rank, string> = {
  1: 'ring-3 ring-rank-1',
  2: 'ring-3 ring-rank-2',
  3: 'ring-3 ring-rank-3',
}

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`
// A spring: overshoots a little, then settles.
const SPRING = 'ease-[cubic-bezier(0.3,1.6,0.45,1)]'

/**
 * Every cookie one baker entered, best first, with where it placed and its points
 * (owner decision 2026-10-14). A bar shows how the cookies make up the baker's total:
 * hovering or tapping a piece lights up its cookie's row, with a bubble naming it, and
 * hovering a row lights up its piece. Tapping a row shows that cookie's votes. A
 * `BottomSheet`, like `VoteBreakdown`, which can open on top of it; the baker and the bar
 * stay pinned while only the cookie list scrolls (owner decision 2026-10-16).
 */
export function BakerBreakdown({ baker, onClose }: BakerBreakdownProps) {
  const titleId = useId()
  // The cookie lit up on the bar and in the list, for the baker it was lit for.
  const [lit, setLit] = useState<{ baker: string; i: number } | null>(null)
  const active = baker && lit?.baker === baker.name ? lit.i : null
  const onActive = (i: number | null) =>
    setLit(baker && i !== null ? { baker: baker.name, i } : null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])

  return (
    <BottomSheet
      open={baker !== null}
      onClose={onClose}
      labelledBy={titleId}
      header={
        baker && (
          <>
            <div className="flex items-center gap-4 pr-10">
              <span
                className={`relative block size-26 shrink-0 rounded-full bg-surface p-1 ring-5 ${
                  baker.rank <= 3 ? ringClasses[baker.rank as Rank] : 'ring-border'
                }`}
              >
                {baker.picture}
                {baker.rank <= 3 && (
                  <RankBadge rank={baker.rank as Rank} className="absolute -right-1 -bottom-1" />
                )}
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-3xl text-primary">
                  {baker.name}
                </h2>
                <p className="font-bold text-ink-muted">
                  {baker.tied ? 'Tied ' : ''}
                  {ordinal(baker.rank)} of {baker.bakers} bakers
                </p>
                <p className="font-display text-xl font-bold">{pts(baker.points)} in all</p>
              </div>
            </div>
            <h3 className="mt-1 font-sans text-sm font-extrabold tracking-wider text-ink-muted uppercase">
              {baker.cookies.length} {baker.cookies.length === 1 ? 'cookie' : 'cookies'}
              {baker.cookies.some((c) => c.onSelect) && ' · tap one for its votes'}
            </h3>
            {baker.points > 0 && (
              <PointsBar
                name={baker.name}
                total={baker.points}
                cookies={baker.cookies}
                active={active}
                onActive={onActive}
                rowRefs={rowRefs}
              />
            )}
          </>
        )
      }
    >
      {baker &&
        (baker.cookies.length === 0 ? (
          <p className="text-ink-muted">No cookies in the results.</p>
        ) : (
          <CookieList
            cookies={baker.cookies}
            active={active}
            onActive={onActive}
            rowRefs={rowRefs}
          />
        ))}
    </BottomSheet>
  )
}

const share = (points: number, total: number) => (total > 0 ? (points / total) * 100 : 0)
// A mouse leaving clears the lit cookie; a tap stays lit until the next tap.
const leaving = (onActive: (i: number | null) => void) => (e: PointerEvent) =>
  e.pointerType === 'mouse' && onActive(null)

/** How the baker's points split across their cookies; pinned above the scrolling list. */
function PointsBar({
  name,
  total,
  cookies,
  active,
  onActive,
  rowRefs,
}: {
  name: string
  total: number
  cookies: readonly BakerBreakdownCookie[]
  active: number | null
  onActive: (i: number | null) => void
  rowRefs: RefObject<(HTMLLIElement | null)[]>
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const current = active === null ? undefined : cookies[active]

  useLayoutEffect(() => {
    const bar = barRef.current
    const bubble = tipRef.current
    const piece = active === null ? null : bar?.querySelector<HTMLElement>(`[data-i="${active}"]`)
    if (!bar || !bubble || !piece) return
    const mid = piece.offsetLeft + piece.offsetWidth / 2
    const left = Math.max(
      0,
      Math.min(bar.offsetWidth - bubble.offsetWidth, mid - bubble.offsetWidth / 2),
    )
    // Placed straight on the DOM: it depends on the rendered widths.
    bubble.style.left = `${left}px`
    bubble.style.setProperty('--arrow', `${mid - left}px`)
  }, [active])

  // Lighting up from the bar brings the row into view; from the list it's already there.
  const fromBar = (i: number) => {
    onActive(i)
    rowRefs.current[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={tipRef}
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[calc(100%-0.25rem)] z-10 flex items-center gap-2 rounded-xl bg-ink px-3 py-1 text-sm font-bold whitespace-nowrap text-on-primary shadow-raised transition-[opacity,translate] duration-150 after:absolute after:top-full after:left-(--arrow) after:-translate-x-1/2 after:border-6 after:border-transparent after:border-t-ink ${
          current ? 'opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        {current && (
          <>
            <span className="font-display font-semibold">{current.category}</span>
            <span className="font-display text-accent">{pts(current.points)}</span>
            <span>{Math.round(share(current.points, total))}%</span>
          </>
        )}
      </div>
      <div
        ref={barRef}
        role="group"
        aria-label={`How ${name}'s ${pts(total)} split across their cookies`}
        onPointerLeave={leaving(onActive)}
        className="flex h-11 items-center gap-0.5"
      >
        {cookies.map((cookie, i) =>
          cookie.points === 0 ? null : (
            <button
              key={cookie.id}
              type="button"
              data-i={i}
              aria-label={`${cookie.category}: ${pts(cookie.points)}, ${Math.round(share(cookie.points, total))}% of the total`}
              onPointerEnter={() => fromBar(i)}
              onFocus={() => fromBar(i)}
              onClick={() => fromBar(i)}
              style={{ width: `${share(cookie.points, total)}%` }}
              className="flex h-full min-w-0 items-center first:*:rounded-l-full last:*:rounded-r-full"
            >
              <span
                style={{ backgroundColor: swatch(i) }}
                className={`block w-full motion-safe:animate-fill motion-safe:transition-[height,opacity,border-radius,box-shadow] motion-safe:duration-200 ${SPRING} ${
                  active === null
                    ? 'h-[18px]'
                    : active === i
                      ? 'h-7 rounded-lg! shadow-card'
                      : 'h-[18px] opacity-35'
                }`}
              />
            </button>
          ),
        )}
      </div>
    </div>
  )
}

/** The baker's cookies, best first: the part of the sheet that scrolls. */
function CookieList({
  cookies,
  active,
  onActive,
  rowRefs,
}: {
  cookies: readonly BakerBreakdownCookie[]
  active: number | null
  onActive: (i: number | null) => void
  rowRefs: RefObject<(HTMLLIElement | null)[]>
}) {
  return (
    <ol onPointerLeave={leaving(onActive)} className="-mx-1 grid">
      {cookies.map((cookie, i) => (
        <li
          key={cookie.id}
          ref={(el) => {
            rowRefs.current[i] = el
          }}
          className="border-t border-border first:border-t-0"
        >
          <CookieRow
            cookie={cookie}
            color={swatch(i)}
            lit={active === i}
            onLight={() => onActive(i)}
          />
        </li>
      ))}
    </ol>
  )
}

function CookieRow({
  cookie,
  color,
  lit,
  onLight,
}: {
  cookie: BakerBreakdownCookie
  color: string
  lit: boolean
  onLight: () => void
}) {
  const place = `${cookie.tied ? 'Tied ' : ''}${ordinal(cookie.rank)} of ${cookie.categorySize}`
  const content = (
    <>
      {/* The colour dot springs open into a glowing strip down the row's side. */}
      <span
        aria-hidden="true"
        style={{ backgroundColor: color, '--glow': color } as CSSProperties}
        className={`absolute top-1/2 -translate-y-1/2 motion-safe:transition-[height,width,left,border-radius,box-shadow] motion-safe:duration-[450ms] ${SPRING} ${
          lit
            ? 'left-0 h-[calc(100%-0.75rem)] w-1.5 rounded-full shadow-[0_0_10px_1px_var(--glow)]'
            : 'left-1 h-2.5 w-2.5 rounded-[3px]'
        }`}
      />
      <span
        className={`block w-13 shrink-0 rounded-full motion-safe:transition-transform motion-safe:duration-300 ${SPRING} ${
          cookie.rank <= 3 ? thumbRing[cookie.rank as Rank] : ''
        } ${lit ? 'translate-x-0.5 scale-106' : ''}`}
      >
        {cookie.picture}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold">{cookie.category}</span>
        <span className="block text-sm font-bold text-ink-muted">{place}</span>
      </span>
      {cookie.rank <= 3 ? (
        <RankBadge rank={cookie.rank as Rank} className="shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted font-display text-xs font-bold text-ink-muted"
        >
          {ordinal(cookie.rank)}
        </span>
      )}
      <span className="shrink-0 text-right font-display text-lg font-bold tabular-nums">
        {pts(cookie.points)}
      </span>
    </>
  )
  const classes = `relative flex min-h-16 w-full items-center gap-2.5 rounded-control py-1.5 pr-1 pl-5 text-left transition-colors duration-200 ${
    lit ? 'bg-accent-subtle' : ''
  }`
  if (!cookie.onSelect) {
    return (
      <div className={classes} onPointerEnter={(e) => e.pointerType === 'mouse' && onLight()}>
        {content}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={cookie.onSelect}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onLight()}
      onFocus={onLight}
      className={`${classes} hover:bg-accent-subtle`}
    >
      {content}
      <span className="sr-only">. See its votes</span>
      <span aria-hidden="true" className="-ml-1 font-display text-xl font-bold text-ink-muted">
        ›
      </span>
    </button>
  )
}
