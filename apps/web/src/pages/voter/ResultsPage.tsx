import { Link, useParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BakerLeaderboard } from '../../components/BakerLeaderboard/BakerLeaderboard.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { Card } from '../../components/Card/Card.tsx'
import { CategoryResults } from '../../components/CategoryResults/CategoryResults.tsx'
import { Confetti } from '../../components/Confetti/Confetti.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useCategories, useEvent, useResults } from '../../lib/data.ts'

/**
 * The results (PRD §9): every category's cookies and the overall baker leaderboard,
 * updating live as late votes come in. Before results open it says so, and switches
 * over by itself when they do.
 */
export function ResultsPage() {
  const { eventId = '' } = useParams()
  const event = useEvent(eventId)
  const open = event.status === 'ready' && event.data?.status === 'results'
  // Only listen once results are open: until then the rules deny the read.
  const results = useResults(open ? eventId : null)
  const categories = useCategories(eventId)

  if (event.status === 'error' || categories.status === 'error') {
    return (
      <Alert tone="danger" title="Something went wrong">
        We couldn't load this event. Check your connection and try again.
      </Alert>
    )
  }
  if (event.status === 'ready' && event.data === null) {
    return (
      <Alert tone="warning" title="Event not found">
        There's no event at <code>{eventId}</code>. Check the link you were given.
      </Alert>
    )
  }
  if (event.status !== 'ready') {
    return <Spinner size="lg" label="Loading the event" className="mx-auto mt-12" />
  }
  const current = event.data!

  if (!open) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-5xl" aria-hidden="true">
          🍪
        </p>
        <h1 className="text-3xl">The results aren't out yet</h1>
        <p className="text-ink-muted">
          They'll show here as soon as the organisers open them. You can leave this page open.
        </p>
        {current.status === 'voting' && (
          <Link to={`/event/${eventId}`} className={buttonClasses({ variant: 'secondary' })}>
            Go vote
          </Link>
        )}
      </Card>
    )
  }

  if (results.status === 'error') {
    return (
      <Alert tone="danger" title="Something went wrong">
        We couldn't load the results. Check your connection and try again.
      </Alert>
    )
  }
  if (results.status === 'loading') {
    return <Spinner size="lg" label="Loading the results" className="mx-auto mt-12" />
  }
  if (results.data === null) {
    return (
      <Card className="space-y-3 text-center">
        <Spinner size="lg" label="" className="mx-auto" />
        <h1 className="text-3xl">Counting the votes…</h1>
        <p className="text-ink-muted">The results will appear here in a moment.</p>
      </Card>
    )
  }

  const { ballotCount, bakers } = results.data
  const plates = new Map(
    categories.status === 'ready' ? categories.data.map((c) => [c.id, c] as const) : [],
  )
  return (
    <div className="space-y-4">
      <Confetti />
      <div className="space-y-1">
        <h1 className="text-3xl">Results 🏆</h1>
        <p className="text-ink-muted">
          {current.name} · {ballotCount} {ballotCount === 1 ? 'vote' : 'votes'}
        </p>
      </div>
      <BakerLeaderboard bakers={bakers} />
      {results.data.categories.map((result) => (
        <CategoryResults
          key={result.categoryId}
          result={result}
          plate={plates.get(result.categoryId)}
        />
      ))}
    </div>
  )
}
