import { useEffect, useRef } from 'react'

export interface BakerChip {
  id: string
  name: string
  /** How many cookies on the current plate are tagged with this baker. */
  count: number
}

export interface BakerChipsProps {
  bakers: readonly BakerChip[]
  /** Whose cookie the next tap on the plate belongs to, or null when nobody is next. */
  active: string | null
  /** Tapping a chip makes that baker next, e.g. to skip someone who didn't enter. */
  onSelect: (bakerId: string) => void
  className?: string
}

/**
 * The event's bakers as one row of chips over the plate: the highlighted chip is whose
 * cookie the admin taps next, and a tick (with a count past one) shows who's already on
 * this plate. Like `Stepper`, the row never wraps: it scrolls sideways, edge to edge,
 * only when it doesn't fit, keeping the highlighted chip in view.
 */
export function BakerChips({ bakers, active, onSelect, className = '' }: BakerChipsProps) {
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = row.current
    const current = el?.querySelector<HTMLElement>('[data-active]')
    if (!el || !current) return
    const start = current.offsetLeft - el.scrollLeft
    const end = start + current.offsetWidth
    const gutter = parseFloat(getComputedStyle(el).paddingLeft)
    if (start < gutter || end > el.clientWidth - gutter) {
      el.scrollTo({ left: current.offsetLeft - gutter, behavior: 'smooth' })
    }
  }, [active])

  return (
    <div
      ref={row}
      role="group"
      aria-label="Bakers"
      className={`relative -mx-(--gutter) overflow-x-auto px-(--gutter) py-1 ${className}`}
    >
      <ul className="flex w-max gap-2">
        {bakers.map((baker) => {
          const isActive = baker.id === active
          return (
            <li key={baker.id}>
              <button
                type="button"
                aria-pressed={isActive}
                data-active={isActive || undefined}
                onClick={() => onSelect(baker.id)}
                className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 font-bold transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-on-primary ring-4 ring-primary-subtle'
                    : baker.count > 0
                      ? 'border-success bg-surface text-ink hover:bg-surface-muted'
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-muted'
                }`}
              >
                {baker.count > 0 && <span aria-hidden="true">✓</span>}
                {baker.name}
                {baker.count > 1 && (
                  <span
                    aria-hidden="true"
                    className="rounded-full bg-success-subtle px-1.5 text-sm text-on-success-subtle"
                  >
                    ×{baker.count}
                  </span>
                )}
                <span className="sr-only">
                  {baker.count === 0
                    ? '(no cookie yet)'
                    : `(${baker.count} ${baker.count === 1 ? 'cookie' : 'cookies'})`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
