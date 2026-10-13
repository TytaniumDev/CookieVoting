import { maxPicksFor, type BallotRankings, type CategoryRanking } from '@cookie-voting/shared'
import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BallotReview } from '../../components/BallotReview/BallotReview.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { CategoryBallot } from '../../components/CategoryBallot/CategoryBallot.tsx'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar.tsx'
import { submitBallot } from '../../lib/ballots.ts'
import type { Category, Event } from '../../lib/data.ts'
import { useSwipe } from '../../lib/useSwipe.ts'

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
  const [rankings, setRankings] = useState<Record<string, CategoryRanking>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reviewing = screen >= categories.length

  // Admins can edit cookies while people vote; drop picks of cookies that are gone.
  const rankingFor = (category: VotableCategory): CategoryRanking =>
    (rankings[category.id] ?? []).filter((id) => category.cookies.some((c) => c.id === id))
  const isComplete = (category: VotableCategory) =>
    rankingFor(category).length >= maxPicksFor(category.cookies.length)

  function setScreen(next: number) {
    setScreenState(next)
    window.scrollTo({ top: 0 })
  }

  const category = categories[screen]
  const canGoOn = category ? isComplete(category) : false
  const swipe = useSwipe({
    onSwipeLeft: () => canGoOn && setScreen(screen + 1),
    onSwipeRight: () => setScreen(Math.max(LANDING, screen - 1)),
  })

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

  const picks = maxPicksFor(category.cookies.length)
  const isLast = screen === categories.length - 1
  return (
    <section className="touch-pan-y space-y-4" aria-labelledby="category-heading" {...swipe}>
      <ProgressBar
        label={event.name}
        value={screen + 1}
        max={categories.length}
        valueText={`Category ${screen + 1} of ${categories.length}`}
      />
      <h1 id="category-heading" className="text-3xl">
        {category.name}
      </h1>
      <CategoryBallot
        photo={category.photo}
        cookies={category.cookies}
        ranking={rankingFor(category)}
        onChange={(ranking) => setRankings({ ...rankings, [category.id]: ranking })}
      />
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setScreen(screen - 1)}>
          ← Back
        </Button>
        <Button className="ml-auto" disabled={!canGoOn} onClick={() => setScreen(screen + 1)}>
          {isLast ? 'Review my votes' : 'Next category →'}
        </Button>
      </div>
      {!canGoOn && (
        <p className="text-right text-sm text-ink-muted">
          Pick {picks === 1 ? 'one' : `all ${picks}`} to go on.
        </p>
      )}
    </section>
  )
}
