import { useEffect, useId, useRef } from 'react'

export interface BakerMenuOption {
  id: string
  name: string
}

export interface BakerMenuProps {
  /** Names the cookie, e.g. "Cookie 2". */
  title: string
  bakers: readonly BakerMenuOption[]
  /** The cookie's baker, marked in the list, or null when it has none. */
  value: string | null
  onChange: (bakerId: string) => void
  onDelete: () => void
  /** Escape, or a press anywhere outside the menu. */
  onClose: () => void
  className?: string
}

/**
 * Who baked a cookie: the event's bakers with the current one marked, and Delete. Opens
 * from a tapped box on the plate; picking a baker retags the cookie. Focus starts on the
 * current baker (or the first) so keyboard users can pick straight away.
 */
export function BakerMenu({
  title,
  bakers,
  value,
  onChange,
  onDelete,
  onClose,
  className = '',
}: BakerMenuProps) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const latestClose = useRef(onClose)
  useEffect(() => {
    latestClose.current = onClose
  })

  useEffect(() => {
    const el = panel.current
    const first =
      el?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? el?.querySelector('button')
    first?.focus({ preventScroll: true })
    const onPointerDown = (e: PointerEvent) => {
      if (el && !el.contains(e.target as Node)) latestClose.current()
    }
    // Capture, so a press that starts a drag on the plate still closes the menu first.
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  return (
    <div
      ref={panel}
      role="dialog"
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
      className={`w-56 rounded-control border border-border bg-surface py-1 shadow-raised ${className}`}
    >
      <p id={`${id}-title`} className="px-3 pt-1 pb-1 text-sm font-bold text-ink-muted">
        Who baked {title.toLowerCase()}?
      </p>
      <ul className="max-h-64 overflow-y-auto">
        {bakers.map((baker) => {
          const current = baker.id === value
          return (
            <li key={baker.id}>
              <button
                type="button"
                aria-pressed={current}
                onClick={() => onChange(baker.id)}
                className={`flex min-h-11 w-full items-center justify-between px-3 text-left font-bold ${
                  current ? 'bg-primary-subtle text-on-primary-subtle' : 'hover:bg-surface-muted'
                }`}
              >
                {baker.name}
                {current && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {bakers.length === 0 && (
        <p className="px-3 py-2 text-ink-muted">Add bakers to the event first.</p>
      )}
      <div className="mt-1 border-t border-border pt-1">
        <button
          type="button"
          onClick={onDelete}
          className="flex min-h-11 w-full items-center px-3 text-left font-bold text-danger hover:bg-danger-subtle"
        >
          Delete {title.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
