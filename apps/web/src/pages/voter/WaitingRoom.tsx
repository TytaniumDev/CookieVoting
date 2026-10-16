import {
  maxPicksFor,
  type BallotRankings,
  type CategoryPlaces,
  type CategoryRanking,
} from '@cookie-voting/shared'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { Card } from '../../components/Card/Card.tsx'
import { PicksSummary } from '../../components/PicksSummary/PicksSummary.tsx'
import { SlowNotice } from '../../components/SlowNotice/SlowNotice.tsx'
import {
  WAITING_SCENES,
  WaitingScene,
  type WaitingSceneName,
} from '../../components/WaitingScene/WaitingScene.tsx'
import { updateBallotCategory } from '../../lib/ballots.ts'
import type { Event } from '../../lib/data.ts'
import { reconnectFirestore } from '../../lib/firebase.ts'
import { reportSlow } from '../../lib/monitoring.ts'
import { useTakingLong } from '../../lib/useTakingLong.ts'
import type { VotableCategory } from './BallotFlow.tsx'
import { CategoryStep } from './CategoryStep.tsx'

const COPY: Record<WaitingSceneName, { title: string; text: string }> = {
  snowman: {
    title: 'Thanks for voting!',
    text: 'Frosty is dancing until the results are in.',
  },
  globe: {
    title: 'Your votes are in!',
    text: 'The snow is settling while the votes are counted.',
  },
  oven: {
    title: 'The results are baking',
    text: 'Your votes are in. The results come out of the oven the moment they open.',
  },
}

/** The voter's medals for a category from their sent ballot, minus cookies since deleted. */
function sentPlaces(category: VotableCategory, rankings: BallotRankings): CategoryPlaces {
  const ranking = rankings[category.id] ?? []
  return Array.from({ length: maxPicksFor(category.cookies.length) }, (_, i) => {
    const id = ranking[i] ?? null
    return category.cookies.some((c) => c.id === id) ? id : null
  })
}

/**
 * After voting, until results open (VoterEventPage then moves on to them): one of the
 * festive scenes, picked afresh on each visit, and the voter's picks. Tapping a category
 * opens it (`?edit=<categoryId>`, so the phone's back button closes it) to change and
 * save, then comes back here.
 *
 * A late voter, who votes once results are already open, lands here too (owner decision
 * 2026-10-15): the same thanks and their picks, read-only, with a View results button.
 */
export function WaitingRoom({
  event,
  categories,
  ballot,
  uid,
}: {
  event: Event
  categories: readonly VotableCategory[]
  ballot: { rankings: BallotRankings }
  uid: string
}) {
  const [scene] = useState(
    () => WAITING_SCENES[Math.floor(Math.random() * WAITING_SCENES.length)] ?? 'snowman',
  )
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [draft, setDraft] = useState<{ categoryId: string; places: CategoryPlaces } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Changes the server has accepted this visit. The ballot listener reports them only once
  // its own connection catches up, which a stalled connection on a phone can hold up.
  const [savedEdits, setSavedEdits] = useState<Record<string, CategoryRanking>>({})
  const rankings: BallotRankings = { ...ballot.rankings, ...savedEdits }
  const [slow, restartWait] = useTakingLong(saving)
  const [reconnecting, setReconnecting] = useState(false)

  // Arriving from the ballot's review screen keeps its scroll position, so the thanks
  // would start off screen and sending would look like it did nothing (COOKIE-VOTING-4).
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    if (slow) reportSlow('save-category')
  }, [slow])

  const resultsOpen = event.status === 'results'
  // Picks can't change once results are open (the rules deny it).
  const editing = resultsOpen ? undefined : categories.find((c) => c.id === params.get('edit'))

  function open(categoryId: string) {
    setDraft(null)
    setError(null)
    setParams({ edit: categoryId }, { state: { fromWaitingRoom: true } })
    window.scrollTo({ top: 0 })
  }

  function close() {
    setDraft(null)
    // Opened from here: step back, so the back button doesn't reopen it.
    if ((location.state as { fromWaitingRoom?: boolean } | null)?.fromWaitingRoom) {
      void navigate(-1)
    } else {
      setParams({}, { replace: true })
    }
    window.scrollTo({ top: 0 })
  }

  async function save(category: VotableCategory, places: CategoryPlaces) {
    setSaving(true)
    setError(null)
    const ranking = places.filter((id) => id !== null)
    try {
      await updateBallotCategory(event.id, uid, category.id, ranking)
      setSavedEdits((edits) => ({ ...edits, [category.id]: ranking }))
      close()
    } catch (e) {
      const code = (e as { code?: string }).code
      setError(
        code === 'permission-denied'
          ? 'Voting has closed, so your picks can’t be changed now.'
          : 'Your change didn’t save. Check your connection and try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  // The change stays queued while Firestore reconnects, and is resent on the new connection.
  async function reconnect() {
    setReconnecting(true)
    try {
      await reconnectFirestore()
    } finally {
      setReconnecting(false)
      restartWait()
    }
  }

  if (editing) {
    const places = draft?.categoryId === editing.id ? draft.places : sentPlaces(editing, rankings)
    return (
      <div className="space-y-3">
        {error && (
          <Alert tone="danger" title="Not saved">
            {error}
          </Alert>
        )}
        {slow && (
          <SlowNotice
            title="Still saving your change"
            onRetry={() => void reconnect()}
            retrying={reconnecting}
          >
            This is taking longer than it should. Check your connection, then try again.
          </SlowNotice>
        )}
        <CategoryStep
          eventName={event.name}
          eyebrow="Change your picks"
          category={editing}
          places={places}
          onChange={(next) => setDraft({ categoryId: editing.id, places: next })}
          onBack={close}
          doneLabel="Save my picks"
          onDone={() => void save(editing, places)}
          busy={saving}
        />
      </div>
    )
  }

  const copy = COPY[scene]
  return (
    <div className="space-y-4">
      <Card tone="festive" flush>
        <WaitingScene scene={scene} className="h-72 sm:h-90" />
        <div className="space-y-1 px-5 pt-4 pb-5 text-center sm:px-8 sm:pt-6 sm:pb-7">
          {resultsOpen ? (
            <>
              <h1 className="text-3xl sm:text-4xl">Thanks for voting!</h1>
              <p className="text-ink-muted">Your votes are in, and so are the results.</p>
              <Link
                to="results"
                className={`mt-3 ${buttonClasses({ size: 'lg', fullWidth: true })}`}
              >
                View results
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl">{copy.title}</h1>
              <p className="text-ink-muted">
                {copy.text} The results show here as soon as they open, so you can leave this page
                open.
              </p>
            </>
          )}
        </div>
      </Card>
      <PicksSummary
        categories={categories}
        rankings={rankings}
        onEdit={resultsOpen ? undefined : open}
      />
    </div>
  )
}
