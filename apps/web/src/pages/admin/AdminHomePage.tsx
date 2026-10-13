import { setupProgress, SETUP_STEP_LABELS } from '@cookie-voting/shared'
import { Link } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { EventCard } from '../../components/EventCard/EventCard.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { signOut } from '../../lib/auth.ts'
import { useCategories, useEvents, useSetup, type Event } from '../../lib/data.ts'

/** One dashboard row; listens to its own categories and setup to show the next step. */
function EventRow({ event }: { event: Event }) {
  const categories = useCategories(event.id)
  const setup = useSetup(event.id)
  const progress =
    categories.status === 'ready' && setup.status === 'ready'
      ? setupProgress({
          status: event.status,
          setup: setup.data,
          categories: categories.data,
          categoryIds: categories.data.map((c) => c.id),
        })
      : null
  return (
    <EventCard
      name={event.name}
      status={event.status}
      createdAt={event.createdAt.toDate()}
      to={`/admin/events/${event.id}`}
      currentStep={progress?.current ? SETUP_STEP_LABELS[progress.current] : null}
    />
  )
}

export function AdminHomePage() {
  const events = useEvents()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Your events</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
          <Link to="/admin/events/new" className={buttonClasses()}>
            New event
          </Link>
        </div>
      </div>

      {events.status === 'loading' && <Spinner label="Loading events" />}
      {events.status === 'error' && (
        <Alert tone="danger" title="Couldn't load events">
          {events.error.message}
        </Alert>
      )}
      {events.status === 'ready' && events.data.length === 0 && (
        <Alert title="No events yet">Create your first cookie competition to get started.</Alert>
      )}
      {events.status === 'ready' && events.data.length > 0 && (
        <ul className="space-y-3">
          {events.data.map((event) => (
            <li key={event.id}>
              <EventRow event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
