import { useState } from 'react'
import { Button } from '../Button/Button.tsx'
import { TextField } from '../TextField/TextField.tsx'

export interface BakerOption {
  id: string
  name: string
}

export interface BakerRosterProps {
  /** Bakers on this event. */
  roster: readonly BakerOption[]
  /** Every baker in the global list. */
  allBakers: readonly BakerOption[]
  onAdd: (bakerId: string) => void
  /** Create a new baker in the global list and add them to the event. */
  onCreate: (name: string) => void
  /** Take a baker off this event (they stay in the global list). */
  onRemove: (bakerId: string) => void
  /** Ids of bakers with a pending add or remove. */
  pendingIds?: ReadonlySet<string>
  /** True while a new baker is being created. */
  creating?: boolean
}

const MAX_MATCHES = 6

const normalise = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * The bakers step: the event's roster, plus type-to-search over the global list with a
 * "create" option when nobody matches exactly (PRD §6.2).
 */
export function BakerRoster({
  roster,
  allBakers,
  onAdd,
  onCreate,
  onRemove,
  pendingIds = new Set(),
  creating = false,
}: BakerRosterProps) {
  const [search, setSearch] = useState('')
  const query = normalise(search)
  const onRoster = new Set(roster.map((b) => b.id))
  const matches = query
    ? allBakers
        .filter((b) => !onRoster.has(b.id) && normalise(b.name).includes(query))
        .slice(0, MAX_MATCHES)
    : []
  const exactMatch = allBakers.some((b) => normalise(b.name) === query)
  const trimmed = search.trim().replace(/\s+/g, ' ')

  return (
    <div className="space-y-6">
      <section aria-labelledby="roster-heading" className="space-y-3">
        <h2 id="roster-heading" className="text-2xl">
          Bakers in this event <span className="text-ink-muted">({roster.length})</span>
        </h2>
        {roster.length === 0 ? (
          <p className="text-ink-muted">No bakers yet. Find or add them below.</p>
        ) : (
          <ul className="divide-y divide-border rounded-card border border-border bg-surface">
            {roster.map((baker) => (
              <li key={baker.id} className="flex items-center justify-between gap-2 py-1 pr-1 pl-5">
                <span className="font-bold">{baker.name}</span>
                <Button
                  variant="ghost"
                  loading={pendingIds.has(baker.id)}
                  onClick={() => onRemove(baker.id)}
                  aria-label={`Remove ${baker.name}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="find-heading" className="space-y-3">
        <h2 id="find-heading" className="text-2xl">
          Add a baker
        </h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            // Enter adds the only match, or creates the typed name.
            const [only] = matches
            if (matches.length === 1 && only) onAdd(only.id)
            else if (trimmed && !exactMatch) onCreate(trimmed)
            else return
            setSearch('')
          }}
        >
          <TextField
            label="Name"
            hint="Search everyone who has baked before, or type a new name."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <ul aria-label="Matching bakers" className="space-y-2">
              {matches.map((baker) => (
                <li key={baker.id}>
                  <Button
                    variant="secondary"
                    fullWidth
                    loading={pendingIds.has(baker.id)}
                    onClick={() => {
                      onAdd(baker.id)
                      setSearch('')
                    }}
                  >
                    Add {baker.name}
                  </Button>
                </li>
              ))}
              {!exactMatch && trimmed && (
                <li>
                  <Button type="submit" variant="primary" fullWidth loading={creating}>
                    Create “{trimmed}”
                  </Button>
                </li>
              )}
              {exactMatch && matches.length === 0 && (
                <li className="text-ink-muted">{trimmed} is already in this event.</li>
              )}
            </ul>
          )}
        </form>
      </section>
    </div>
  )
}
