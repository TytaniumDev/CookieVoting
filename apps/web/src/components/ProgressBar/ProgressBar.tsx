export interface ProgressBarProps {
  value: number
  max: number
  /** Visible label above the bar, also used as its accessible name. */
  label: string
  /** Text read out instead of the raw numbers, e.g. "Category 2 of 5". */
  valueText?: string
  className?: string
}

/** Shows how far through a sequence the user is (e.g. voting categories). */
export function ProgressBar({ value, max, label, valueText, className = '' }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? (clamped / max) * 100 : 0

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-bold">{label}</span>
        {valueText && <span className="text-ink-muted">{valueText}</span>}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={valueText}
        className="h-3 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-[repeating-linear-gradient(135deg,var(--color-primary)_0_8px,var(--color-primary-hover)_8px_16px)] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
