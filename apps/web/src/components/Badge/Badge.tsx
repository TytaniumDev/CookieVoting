import type { HTMLAttributes } from 'react'

export type BadgeTone =
  'neutral' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink',
  primary: 'bg-primary-subtle text-on-primary-subtle',
  secondary: 'bg-secondary-subtle text-on-secondary-subtle',
  accent: 'bg-accent-subtle text-on-accent-subtle',
  success: 'bg-success-subtle text-on-success-subtle',
  warning: 'bg-warning-subtle text-on-warning-subtle',
  danger: 'bg-danger-subtle text-on-danger-subtle',
}

/** A short status label, e.g. an event's state on the dashboard. */
export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${toneClasses[tone]} ${className}`}
      {...props}
    />
  )
}
