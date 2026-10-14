import {
  SETUP_STEP_LABELS,
  SETUP_STEPS,
  setupProgress,
  type SetupStep,
} from '@cookie-voting/shared'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { Stepper } from '../../components/Stepper/Stepper.tsx'
import { useCategories, useEvent, useSetup } from '../../lib/data.ts'
import { BakersStep } from './steps/BakersStep.tsx'
import { CategoriesStep } from './steps/CategoriesStep.tsx'
import { CookiesStep } from './steps/CookiesStep.tsx'
import { ResultsStep } from './steps/ResultsStep.tsx'
import { VotingStep } from './steps/VotingStep.tsx'

function isStep(value: string | null): value is SetupStep {
  return SETUP_STEPS.includes(value as SetupStep)
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
    <section className="space-y-4">
      {/* Title and step tabs share a row on wide screens, so a step's work starts higher. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-1 lg:flex-1">
          <Link
            to="/"
            aria-label="All events"
            className="-ml-2 grid size-11 shrink-0 place-items-center rounded-control text-2xl font-bold text-primary hover:bg-surface-muted"
          >
            <span aria-hidden="true">←</span>
          </Link>
          <h1 className="truncate text-2xl" title={event.data.name}>
            {event.data.name}
          </h1>
        </div>
        <Stepper
          steps={SETUP_STEPS.map((id) => ({
            id,
            label: SETUP_STEP_LABELS[id],
            done: progress.done[id],
          }))}
          selected={selected}
          onSelect={(step) => setSearchParams({ step }, { replace: true })}
          className="lg:mx-0 lg:shrink-0 lg:px-0"
        />
      </div>
      {selected === 'bakers' ? (
        <BakersStep eventId={eventId} setup={setup.data} />
      ) : selected === 'categories' ? (
        <CategoriesStep eventId={eventId} categories={categories.data} />
      ) : selected === 'cookies' ? (
        <CookiesStep eventId={eventId} categories={categories.data} setup={setup.data} />
      ) : selected === 'voting' ? (
        <VotingStep event={event.data} progress={progress} />
      ) : (
        <ResultsStep event={event.data} />
      )}
    </section>
  )
}
