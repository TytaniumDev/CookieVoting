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
 * show which are done. Scrolls sideways on narrow phones rather than wrapping.
 */
export function Stepper<Id extends string>({
  steps,
  selected,
  onSelect,
  label = 'Setup steps',
  className = '',
}: StepperProps<Id>) {
  return (
    <nav aria-label={label} className={`-mx-4 overflow-x-auto px-4 ${className}`}>
      <ol className="flex min-w-max gap-2">
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
