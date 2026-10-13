import { useState } from 'react'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { BakerRoster } from '../../../components/BakerRoster/BakerRoster.tsx'
import { Spinner } from '../../../components/Spinner/Spinner.tsx'
import { useBakers, type Setup } from '../../../lib/data.ts'
import {
  addBakerToEvent,
  createBakerForEvent,
  removeBakerFromEvent,
} from '../../../lib/mutations.ts'

export function BakersStep({ eventId, setup }: { eventId: string; setup: Setup | null }) {
  const bakers = useBakers()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function track(id: string, action: Promise<unknown>) {
    setError(null)
    setPendingIds((ids) => new Set(ids).add(id))
    try {
      await action
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPendingIds((ids) => {
        const next = new Set(ids)
        next.delete(id)
        return next
      })
    }
  }

  if (bakers.status === 'loading') return <Spinner label="Loading bakers" />
  if (bakers.status === 'error') {
    return (
      <Alert tone="danger" title="Couldn't load bakers">
        {bakers.error.message}
      </Alert>
    )
  }

  const rosterIds = setup?.bakerIds ?? []
  const byId = new Map(bakers.data.map((b) => [b.id, b]))
  const roster = rosterIds.flatMap((id) => byId.get(id) ?? [])

  return (
    <div className="space-y-4">
      {error && (
        <Alert tone="danger" title="That didn't save">
          {error}
        </Alert>
      )}
      <BakerRoster
        roster={roster}
        allBakers={bakers.data}
        pendingIds={pendingIds}
        creating={creating}
        onAdd={(id) => void track(id, addBakerToEvent(eventId, id))}
        onRemove={(id) => void track(id, removeBakerFromEvent(eventId, id))}
        onCreate={async (name) => {
          setCreating(true)
          setError(null)
          try {
            await createBakerForEvent(eventId, name)
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
          } finally {
            setCreating(false)
          }
        }}
      />
      <p className="text-ink-muted">
        You can skip this and come back later; bakers are needed before cookies are assigned.
      </p>
    </div>
  )
}
