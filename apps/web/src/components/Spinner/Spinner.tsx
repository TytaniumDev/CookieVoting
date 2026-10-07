export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  /**
   * Accessible name announced to screen readers. Pass an empty string when the
   * surrounding element already says it is busy (e.g. a loading button).
   */
  label?: string
  size?: SpinnerSize
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-6 border-3',
  lg: 'size-10 border-4',
}

/**
 * A loading indicator. Uses `currentColor`, so it inherits the text colour of
 * whatever it sits in (e.g. a primary button). Under reduced motion it stays
 * still and the label still tells assistive tech that something is loading.
 */
export function Spinner({ label = 'Loading', size = 'md', className = '' }: SpinnerProps) {
  const circle = (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-current border-r-transparent motion-safe:animate-spin ${sizeClasses[size]}`}
    />
  )
  if (!label) return <span className={`inline-flex ${className}`}>{circle}</span>
  return (
    <span role="status" className={`inline-flex ${className}`}>
      {circle}
      <span className="sr-only">{label}</span>
    </span>
  )
}
