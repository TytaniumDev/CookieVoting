import {
  maxPicksFor,
  type BallotRankings,
  type CategoryPlaces,
  type CategoryRanking,
} from '@cookie-voting/shared'
import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BallotReview } from '../../components/BallotReview/BallotReview.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { submitBallot } from '../../lib/ballots.ts'
import type { Category, Event } from '../../lib/data.ts'
import { CategoryStep } from './CategoryStep.tsx'

/** A category voters can vote in: it has a photo and cookies. */
export type VotableCategory = Category & { photo: NonNullable<Category['photo']> }

const LANDING = -1

/**
 * Landing → one category at a time → review → submit (PRD §7). Picks stay in memory
 * until submit. Every category needs all its picks (owner decision Q3).
 */
export function BallotFlow({
  event,
  categories,
  uid,
}: {
  event: Event
  categories: readonly VotableCategory[]
  uid: string
}) {
  const [screen, setScreenState] = useState(LANDING)
  const [medals, setMedals] = useState<Record<string, CategoryPlaces>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reviewing = screen >= categories.length

  // Admins can edit cookies while people vote; drop medals of cookies that are gone.
  const placesFor = (category: VotableCategory): CategoryPlaces =>
    Array.from({ length: maxPicksFor(category.cookies.length) }, (_, i) => {
      const id = medals[category.id]?.[i] ?? null
      return category.cookies.some((c) => c.id === id) ? id : null
    })
  // Only read once every category is complete (review and submit), so there are no gaps.
  const rankingFor = (category: VotableCategory): CategoryRanking =>
    placesFor(category).filter((id) => id !== null)

  function setScreen(next: number) {
    setScreenState(next)
    window.scrollTo({ top: 0 })
  }

  const category = categories[screen]

  async function submit() {
    setSubmitting(true)
    setError(null)
    const ballot: BallotRankings = Object.fromEntries(categories.map((c) => [c.id, rankingFor(c)]))
    try {
      await submitBallot(event.id, uid, ballot)
      // The ballot listener moves the page on to the thank-you screen.
    } catch (e) {
      const code = (e as { code?: string }).code
      setError(
        code === 'permission-denied'
          ? "You've already voted on this device, or voting has closed."
          : "Your votes didn't send. Check your connection and try again.",
      )
      setSubmitting(false)
    }
  }

  if (screen === LANDING) {
    return (
      <Card tone="festive" className="space-y-4">
        <h1 className="text-3xl">{event.name}</h1>
        {event.status === 'results' && (
          <Alert title="Results are open">
            You can still vote. <Link to="results">See the results</Link>
          </Alert>
        )}
        <p>
          Pick your top {categories.some((c) => c.cookies.length >= 3) ? 3 : 'cookies'} in each of{' '}
          {categories.length === 1 ? 'this category' : `these ${categories.length} categories`}:
        </p>
        <ol className="list-inside list-decimal space-y-1 font-bold">
          {categories.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ol>
        <Button size="lg" fullWidth onClick={() => setScreen(0)}>
          Start voting
        </Button>
      </Card>
    )
  }

  if (reviewing || !category) {
    return (
      <section className="space-y-4" aria-labelledby="review-heading">
        <h1 id="review-heading" className="text-3xl">
          Check your votes
        </h1>
        {error && (
          <Alert tone="danger" title="Not sent">
            {error}
          </Alert>
        )}
        <BallotReview
          categories={categories}
          rankings={Object.fromEntries(categories.map((c) => [c.id, rankingFor(c)]))}
          onEdit={setScreen}
          onSubmit={() => void submit()}
          submitting={submitting}
        />
      </section>
    )
  }

  return (
    <CategoryStep
      eventName={event.name}
      eyebrow={`Category ${screen + 1} of ${categories.length}`}
      category={category}
      places={placesFor(category)}
      onChange={(next) => setMedals({ ...medals, [category.id]: next })}
      onBack={() => setScreen(screen - 1)}
      doneLabel={screen === categories.length - 1 ? 'Review my votes' : 'Next category →'}
      onDone={() => setScreen(screen + 1)}
    />
  )
}
