import type { ReactNode } from 'react'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
  /** Adds a Dismiss button. */
  onDismiss?: () => void
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
export function Alert({ tone = 'info', title, children, className = '', onDismiss }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-control border-l-4 p-4 ${toneClasses[tone]} ${className}`}
    >
      <span aria-hidden="true" className="text-xl leading-6">
        {icons[tone]}
      </span>
      <div className="min-w-0 flex-1 space-y-1 break-words">
        {title && <p className="font-display text-lg leading-6 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-2 grid size-11 shrink-0 place-items-center rounded-control text-xl leading-none hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-focus"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  )
}
