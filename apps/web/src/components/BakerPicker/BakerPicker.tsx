import { useId, useState, type KeyboardEvent } from 'react'

export interface BakerOption {
  id: string
  name: string
}

export interface BakerPickerProps {
  /** The event's roster. */
  bakers: readonly BakerOption[]
  /** The assigned baker, or null. */
  value: string | null
  onChange: (bakerId: string) => void
  label: string
  /** Hide the label visually (it's still read out), e.g. under a numbered cookie. */
  hideLabel?: boolean
  className?: string
}

/**
 * Type-to-filter baker choice (an ARIA combobox). Each cookie starts empty rather than
 * with the last baker picked, so nobody is assigned by accident (PRD §6.5).
 */
export function BakerPicker({
  bakers,
  value,
  onChange,
  label,
  hideLabel = false,
  className = '',
}: BakerPickerProps) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const selected = bakers.find((b) => b.id === value) ?? null
  const q = query.trim().toLowerCase()
  const matches = q ? bakers.filter((b) => b.name.toLowerCase().includes(q)) : bakers
  const activeOption = open ? matches[Math.min(active, matches.length - 1)] : undefined

  function choose(baker: BakerOption) {
    onChange(baker.id)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (Math.min(i, matches.length - 1) + step + matches.length) % matches.length)
    } else if (e.key === 'Enter' && activeOption) {
      e.preventDefault()
      choose(activeOption)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'font-bold'}>
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? `${id}-${activeOption.id}` : undefined}
        autoComplete="off"
        value={open ? query : (selected?.name ?? '')}
        placeholder={selected ? selected.name : 'Choose a baker'}
        onFocus={() => {
          setOpen(true)
          setQuery('')
          setActive(0)
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        className={`min-h-11 w-full rounded-control border-2 bg-surface px-3 text-base text-ink placeholder:text-ink-muted ${
          selected ? 'border-border-strong' : 'border-warning'
        }`}
      />
      <div
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-control border border-border bg-surface py-1 shadow-raised"
      >
        <ul id={listId} role="listbox" aria-label={label}>
          {matches.map((baker) => (
            <li
              key={baker.id}
              id={`${id}-${baker.id}`}
              role="option"
              aria-selected={baker.id === value}
              // Keep focus in the input so blur doesn't close the list before the click.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(baker)}
              className={`flex min-h-11 cursor-pointer items-center justify-between px-3 ${
                baker === activeOption ? 'bg-surface-muted' : ''
              }`}
            >
              {baker.name}
              {baker.id === value && <span aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
        {matches.length === 0 && (
          <p className="px-3 py-2 text-ink-muted">
            {bakers.length === 0
              ? 'Add bakers to the event first.'
              : `No baker matches “${query}”.`}
          </p>
        )}
      </div>
    </div>
  )
}
