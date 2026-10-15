import type { PlatePhoto } from '@cookie-voting/shared'
import { useEffect, useRef } from 'react'

export interface PlateTab {
  id: string
  name: string
  photo: Pick<PlatePhoto, 'url'> | null
  /** Every cookie on the plate is boxed and tagged. */
  done: boolean
}

export interface PlateTabsProps {
  plates: readonly PlateTab[]
  selected: string
  onSelect: (id: string) => void
  className?: string
}

/**
 * The plates of the Cookies step, each a small photo of itself with its name, so they
 * read as plates rather than steps or bakers. A tick on the photo marks a finished
 * plate. Like `Stepper`, one row that scrolls sideways, edge to edge, only when it
 * doesn't fit, keeping the selected plate in view.
 */
export function PlateTabs({ plates, selected, onSelect, className = '' }: PlateTabsProps) {
  const nav = useRef<HTMLElement>(null)

  useEffect(() => {
    const row = nav.current
    const current = row?.querySelector<HTMLElement>('[aria-current]')
    if (!row || !current) return
    const start = current.offsetLeft - row.scrollLeft
    const end = start + current.offsetWidth
    const gutter = parseFloat(getComputedStyle(row).paddingLeft)
    if (start < gutter || end > row.clientWidth - gutter) {
      row.scrollTo({ left: current.offsetLeft - gutter, behavior: 'smooth' })
    }
  }, [selected])

  return (
    <nav
      ref={nav}
      aria-label="Plates"
      className={`relative -mx-(--gutter) overflow-x-auto overflow-y-hidden px-(--gutter) py-1 ${className}`}
    >
      <ul className="flex w-max gap-2">
        {plates.map((plate) => {
          const isSelected = plate.id === selected
          return (
            <li key={plate.id}>
              <button
                type="button"
                aria-current={isSelected ? 'page' : undefined}
                onClick={() => onSelect(plate.id)}
                className={`flex h-13 items-center gap-2 rounded-control border-2 bg-surface py-1 pr-3 pl-1 font-bold transition-colors ${
                  isSelected
                    ? 'border-primary text-ink ring-3 ring-primary-subtle'
                    : 'border-border text-ink-muted hover:bg-surface-muted'
                }`}
              >
                <span className="relative h-10.5 w-14 shrink-0 overflow-hidden rounded-[0.5rem] bg-surface-muted">
                  {plate.photo && (
                    <img
                      src={plate.photo.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  )}
                  {plate.done && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0.5 bottom-0.5 grid size-4 place-items-center rounded-full bg-success text-[0.6875rem] text-on-success"
                    >
                      ✓
                    </span>
                  )}
                </span>
                {plate.name}
                <span className="sr-only">{plate.done ? '(done)' : '(to do)'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
