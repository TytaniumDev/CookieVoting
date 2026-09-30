import { useParams } from 'react-router'

export function ResultsPage() {
  const { eventId } = useParams()
  return (
    <section className="space-y-2">
      <h1 className="text-3xl">Results 🏆</h1>
      <p className="text-ink-muted">
        Results for event <code>{eventId}</code> arrive in roadmap phase 8.
      </p>
    </section>
  )
}
