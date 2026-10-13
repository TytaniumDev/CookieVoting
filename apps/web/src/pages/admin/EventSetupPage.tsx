import { useParams } from 'react-router'

export function EventSetupPage() {
  const { eventId } = useParams()
  return (
    <section className="space-y-2">
      <h1 className="text-3xl">Event setup</h1>
      <p className="text-ink-muted">
        The guided setup for event <code>{eventId}</code> arrives in roadmap phases 3–7.
      </p>
    </section>
  )
}
