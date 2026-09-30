import { useParams } from 'react-router'

export function VoterEventPage() {
  const { eventId } = useParams()
  return (
    <section className="space-y-2">
      <h1 className="text-3xl">Let's vote! 🎄</h1>
      <p className="text-ink-muted">
        Voting for event <code>{eventId}</code> arrives in roadmap phase 7.
      </p>
    </section>
  )
}
