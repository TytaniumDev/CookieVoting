import { setupProgress, SETUP_STEP_LABELS } from '@cookie-voting/shared'
import { Link } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { EventCard } from '../../components/EventCard/EventCard.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { signOut } from '../../lib/auth.ts'
import { SharePanel } from '../../components/SharePanel/SharePanel.tsx'
import {
  useAdminRequests,
  useCategories,
  useEvents,
  useResults,
  useSetup,
  type Event,
} from '../../lib/data.ts'
import { voterUrl } from '../../lib/links.ts'
import { useStatusChange } from './useStatusChange.tsx'

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
    >
      {event.status !== 'setup' && <LiveControls event={event} />}
    </EventCard>
  )
}

/** PRD §10: while an event is live, the dashboard shows its count, link and Open results. */
function LiveControls({ event }: { event: Event }) {
  const results = useResults(event.id)
  const status = useStatusChange(event.id, event.status)
  const ballotCount = results.status === 'ready' ? (results.data?.ballotCount ?? 0) : null
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite">
          <span className="font-display text-2xl font-semibold">{ballotCount ?? '…'}</span>{' '}
          <span className="text-ink-muted">{ballotCount === 1 ? 'ballot' : 'ballots'} so far</span>
        </p>
        {event.status === 'voting' && (
          <Button onClick={() => status.change('results')} loading={status.busy}>
            Open results
          </Button>
        )}
      </div>
      <SharePanel url={voterUrl(event.id)} title={event.name} showQrCode={false} />
      {status.dialog}
    </div>
  )
}

export function AdminHomePage() {
  const events = useEvents()
  const requests = useAdminRequests()
  const requestCount = requests.status === 'ready' ? requests.data.length : 0

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Your events</h1>
        <div className="flex gap-2">
          <Button variant="ghost" flush="start" onClick={() => void signOut()}>
            Sign out
          </Button>
          <Link to="/admin/admins" className={buttonClasses({ variant: 'ghost' })}>
            Admins
          </Link>
          <Link to="/admin/events/new" className={buttonClasses()}>
            New event
          </Link>
        </div>
      </div>

      {requestCount > 0 && (
        <Alert
          title={
            requestCount === 1
              ? 'Someone wants to be an admin'
              : `${requestCount} people want to be admins`
          }
        >
          <Link to="/admin/admins" className="font-bold underline">
            Review on the Admins page
          </Link>
        </Alert>
      )}
      {events.status === 'loading' && <Spinner layout="section" label="Loading events" />}
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
