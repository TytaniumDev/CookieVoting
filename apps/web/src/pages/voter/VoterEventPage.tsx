import { useParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useEvent } from '../../lib/data.ts'

export function VoterEventPage() {
  const { eventId = '' } = useParams()
  const event = useEvent(eventId)

  return (
    <section className="space-y-4">
      <h1 className="text-3xl">Let's vote! 🎄</h1>
      {event.status === 'loading' && <Spinner label="Loading the event" />}
      {event.status === 'error' && (
        <Alert tone="danger" title="Something went wrong">
          We couldn't load this event. Check your connection and try again.
        </Alert>
      )}
      {event.status === 'ready' && event.data === null && (
        <Alert tone="warning" title="Event not found">
          There's no event at <code>{eventId}</code>. Check the link you were given.
        </Alert>
      )}
      {event.status === 'ready' && event.data !== null && (
        <>
          <p className="font-display text-xl">{event.data.name}</p>
          <p className="text-ink-muted">Voting arrives in roadmap phase 8.</p>
        </>
      )}
    </section>
  )
}
