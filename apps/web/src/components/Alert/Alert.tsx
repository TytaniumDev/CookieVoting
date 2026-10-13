import type { ReactNode } from 'react'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}

const toneClasses: Record<AlertTone, string> = {
  info: 'border-secondary bg-secondary-subtle text-on-secondary-subtle',
  success: 'border-success bg-success-subtle text-on-success-subtle',
  warning: 'border-warning bg-warning-subtle text-on-warning-subtle',
  danger: 'border-danger bg-danger-subtle text-on-danger-subtle',
}

const icons: Record<AlertTone, string> = {
  info: '🔔',
  success: '🎉',
  warning: '⚠️',
  danger: '⛔',
}

/**
 * An inline message. Danger alerts use `role="alert"` so they are announced
 * immediately; the others use the polite `role="status"`.
 */
export function Alert({ tone = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-control border-l-4 p-4 ${toneClasses[tone]} ${className}`}
    >
      <span aria-hidden="true" className="text-xl leading-6">
        {icons[tone]}
      </span>
      <div className="space-y-1">
        {title && <p className="font-display text-lg leading-6 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
