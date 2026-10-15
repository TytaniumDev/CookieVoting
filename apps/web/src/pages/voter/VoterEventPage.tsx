import { stableShuffle } from '@cookie-voting/shared'
import { Navigate, useParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useVoter } from '../../lib/auth.ts'
import { useBallot, useCategories, useEvent } from '../../lib/data.ts'
import { BallotFlow, type VotableCategory } from './BallotFlow.tsx'
import { WaitingRoom } from './WaitingRoom.tsx'

/**
 * The voter link (PRD §7). Signs the voter in anonymously, then shows the ballot, or
 * the waiting room once they've voted (where they can change a category), which moves
 * on to the results by itself.
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
    return <Spinner layout="screen" label="Loading the event" />
  }
  const current = event.data!
  // Each voter sees the cookies in their own order, so no cookie gains from going first.
  // It's the same order every visit (seeded by the voter's id), so cookies don't move
  // on reload or when changing a category from the waiting room.
  const votable = categories.data
    .filter((c): c is VotableCategory => c.photo !== null && c.cookies.length > 0)
    .map((c) => ({ ...c, cookies: stableShuffle(c.cookies, `${uid}:${c.id}`, (k) => k.id) }))

  if (ballot.data) {
    if (current.status === 'results') return <Navigate to="results" replace />
    return <WaitingRoom event={current} categories={votable} ballot={ballot.data} uid={uid!} />
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

  if (votable.length === 0) {
    return (
      <Alert tone="warning" title="Nothing to vote on yet">
        This event has no cookies yet. Check back soon.
      </Alert>
    )
  }
  return <BallotFlow event={current} categories={votable} uid={uid!} />
}
