import {
  SETUP_STEP_LABELS,
  SETUP_STEPS,
  setupProgress,
  type SetupStep,
} from '@cookie-voting/shared'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BakerRoster } from '../../components/BakerRoster/BakerRoster.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { Stepper } from '../../components/Stepper/Stepper.tsx'
import { useBakers, useCategories, useEvent, useSetup, type Setup } from '../../lib/data.ts'
import { addBakerToEvent, createBakerForEvent, removeBakerFromEvent } from '../../lib/mutations.ts'

/** Roadmap phase that builds each step still to come. */
const COMING_IN: Partial<Record<SetupStep, number>> = {
  categories: 4,
  cookies: 5,
  assign: 7,
  voting: 7,
  results: 7,
}

function isStep(value: string | null): value is SetupStep {
  return SETUP_STEPS.includes(value as SetupStep)
}

function BakersStep({ eventId, setup }: { eventId: string; setup: Setup | null }) {
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

export function EventSetupPage() {
  const { eventId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const event = useEvent(eventId)
  const categories = useCategories(eventId)
  const setup = useSetup(eventId)
  // Without ?step, open the first unfinished step and stay there: finishing a step
  // shouldn't yank the admin to the next one mid-task.
  const [pinnedStep, setPinnedStep] = useState<SetupStep | null>(null)

  if (event.status === 'loading' || categories.status === 'loading' || setup.status === 'loading') {
    return <Spinner size="lg" label="Loading the event" className="mx-auto mt-12" />
  }
  if (event.status === 'error' || categories.status === 'error' || setup.status === 'error') {
    return (
      <Alert tone="danger" title="Couldn't load this event">
        Check your connection and reload the page.
      </Alert>
    )
  }
  if (event.data === null) {
    return (
      <Alert tone="warning" title="Event not found">
        It may have been deleted. <Link to="/">Back to your events</Link>
      </Alert>
    )
  }

  const progress = setupProgress({
    status: event.data.status,
    setup: setup.data,
    categories: categories.data,
    categoryIds: categories.data.map((c) => c.id),
  })
  const openingStep = pinnedStep ?? progress.current ?? 'results'
  if (pinnedStep === null) setPinnedStep(openingStep)
  const requested = searchParams.get('step')
  const selected: SetupStep = isStep(requested) ? requested : openingStep

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link to="/" className="text-sm font-bold text-primary">
          ← All events
        </Link>
        <h1 className="text-3xl">{event.data.name}</h1>
      </div>
      <Stepper
        steps={SETUP_STEPS.map((id) => ({
          id,
          label: SETUP_STEP_LABELS[id],
          done: progress.done[id],
        }))}
        selected={selected}
        onSelect={(step) => setSearchParams({ step }, { replace: true })}
      />
      {selected === 'bakers' ? (
        <BakersStep eventId={eventId} setup={setup.data} />
      ) : (
        <Card>
          <h2 className="text-2xl">{SETUP_STEP_LABELS[selected]}</h2>
          <p className="text-ink-muted">
            This step arrives in roadmap phase {COMING_IN[selected]}.
          </p>
        </Card>
      )}
    </section>
  )
}
