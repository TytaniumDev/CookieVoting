import { Navigate, useParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useVoter } from '../../lib/auth.ts'
import { useBallot, useCategories, useEvent } from '../../lib/data.ts'
import { BallotFlow, type VotableCategory } from './BallotFlow.tsx'

/**
 * The voter link (PRD §7). Signs the voter in anonymously, then shows the ballot, or
 * the thank-you screen once they've voted, which moves on to the results by itself.
 */
export function VoterEventPage() {
  const { eventId = '' } = useParams()
  const event = useEvent(eventId)
  const voter = useVoter()
  const uid = voter.status === 'ready' ? voter.data.uid : null
  const ballot = useBallot(eventId, uid)
  const categories = useCategories(eventId)

  if (event.status === 'error' || voter.status === 'error' || categories.status === 'error') {
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
  if (event.status !== 'ready' || categories.status !== 'ready' || ballot.status !== 'ready') {
    // A ballot read can fail only if signing in failed; treat it as still loading.
    return <Spinner size="lg" label="Loading the event" className="mx-auto mt-12" />
  }
  const current = event.data!

  if (ballot.data) {
    if (current.status === 'results') return <Navigate to="results" replace />
    return (
      <Card tone="festive" className="space-y-2 text-center">
        <p className="text-5xl" aria-hidden="true">
          🎉
        </p>
        <h1 className="text-3xl">Thanks for voting!</h1>
        <p className="text-ink-muted">
          The results will show here as soon as they open. You can leave this page open.
        </p>
      </Card>
    )
  }

  if (current.status === 'setup') {
    return (
      <Card className="space-y-2 text-center">
        <h1 className="text-3xl">{current.name}</h1>
        <p className="text-ink-muted">
          Voting isn't open yet. This page updates by itself when it opens.
        </p>
      </Card>
    )
  }

  const votable = categories.data.filter(
    (c): c is VotableCategory => c.photo !== null && c.cookies.length > 0,
  )
  if (votable.length === 0) {
    return (
      <Alert tone="warning" title="Nothing to vote on yet">
        This event has no cookies yet. Check back soon.
      </Alert>
    )
  }
  return <BallotFlow event={current} categories={votable} uid={uid!} />
}
