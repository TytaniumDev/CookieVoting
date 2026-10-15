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
 * The admin setup steps as a progress line: numbered circles joined by lines, green
 * ticks for done steps and the shown step filled in. Every step can be opened at any
 * time (owner decision Q1). On phones only the shown step keeps its name on screen;
 * if the line still doesn't fit, it scrolls sideways, edge to edge, keeping the shown
 * step in view.
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
      className={`relative -mx-(--gutter) overflow-x-auto overflow-y-hidden px-(--gutter) ${className}`}
    >
      <ol className="-ms-1 flex w-max items-center sm:-ms-1.5">
        {steps.map((step, index) => {
          const isSelected = step.id === selected
          const previous = steps[index - 1]
          return (
            <li key={step.id} className="flex items-center">
              {previous && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-2 shrink-0 rounded-full sm:mx-2 sm:w-8 ${previous.done ? 'bg-success' : 'bg-border'}`}
                />
              )}
              <button
                type="button"
                aria-current={isSelected ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-1 sm:gap-2 sm:px-1.5 font-display font-semibold transition-colors hover:bg-surface-muted ${
                  isSelected ? 'text-primary' : step.done ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm ${
                    isSelected
                      ? 'border-primary bg-primary text-on-primary ring-4 ring-primary-subtle'
                      : step.done
                        ? 'border-success bg-success text-on-success'
                        : 'border-border bg-surface text-ink-muted'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </span>
                <span className={isSelected ? '' : 'max-sm:sr-only'}>{step.label}</span>
                <span className="sr-only">{step.done ? '(done)' : '(to do)'}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
