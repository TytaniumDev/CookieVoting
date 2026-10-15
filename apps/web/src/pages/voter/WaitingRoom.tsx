import { maxPicksFor, type CategoryPlaces } from '@cookie-voting/shared'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { Card } from '../../components/Card/Card.tsx'
import { PicksSummary } from '../../components/PicksSummary/PicksSummary.tsx'
import {
  WAITING_SCENES,
  WaitingScene,
  type WaitingSceneName,
} from '../../components/WaitingScene/WaitingScene.tsx'
import { updateBallotCategory } from '../../lib/ballots.ts'
import type { Ballot, Event } from '../../lib/data.ts'
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
function sentPlaces(category: VotableCategory, ballot: Ballot): CategoryPlaces {
  const ranking = ballot.rankings[category.id] ?? []
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
  ballot: Ballot
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
    try {
      await updateBallotCategory(
        event.id,
        uid,
        category.id,
        places.filter((id) => id !== null),
      )
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

  if (editing) {
    const places = draft?.categoryId === editing.id ? draft.places : sentPlaces(editing, ballot)
    return (
      <div className="space-y-3">
        {error && (
          <Alert tone="danger" title="Not saved">
            {error}
          </Alert>
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
        rankings={ballot.rankings}
        onEdit={resultsOpen ? undefined : open}
      />
    </div>
  )
}
