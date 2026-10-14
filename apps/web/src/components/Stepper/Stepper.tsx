import { useEffect, useRef } from 'react'

export interface StepperStep<Id extends string = string> {
  id: Id
  label: string
  done: boolean
}

export interface StepperProps<Id extends string = string> {
  steps: readonly StepperStep<Id>[]
  /** The step being shown. */
  selected: Id
  onSelect: (id: Id) => void
  label?: string
  className?: string
}

/**
 * The admin setup steps. Every step can be opened at any time (owner decision Q1); ticks
 * show which are done. One row that never wraps: it scrolls sideways, edge to edge, only
 * when the screen is too narrow for every step, keeping the selected one in view.
 */
export function Stepper<Id extends string>({
  steps,
  selected,
  onSelect,
  label = 'Setup steps',
  className = '',
}: StepperProps<Id>) {
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
      aria-label={label}
      className={`relative -mx-(--gutter) overflow-x-auto px-(--gutter) ${className}`}
    >
      <ol className="flex w-max gap-2">
        {steps.map((step, index) => {
          const isSelected = step.id === selected
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={isSelected ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-3 font-display font-semibold transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface text-ink hover:bg-surface-muted'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 place-items-center rounded-full text-sm ${
                    step.done
                      ? 'bg-success text-on-success'
                      : isSelected
                        ? 'bg-on-primary text-primary'
                        : 'bg-surface-muted text-ink'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </span>
                {step.label}
                <span className="sr-only">{step.done ? '(done)' : '(to do)'}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
