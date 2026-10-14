import {
  maxPicksFor,
  type BallotRankings,
  type CategoryPlaces,
  type CategoryRanking,
} from '@cookie-voting/shared'
import { useState } from 'react'
import { Link } from 'react-router'
import { AppBarContent } from '../../app/AppBarSlot.tsx'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BallotReview } from '../../components/BallotReview/BallotReview.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Card } from '../../components/Card/Card.tsx'
import { CategoryBallot } from '../../components/CategoryBallot/CategoryBallot.tsx'
import { submitBallot } from '../../lib/ballots.ts'
import type { Category, Event } from '../../lib/data.ts'

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

  const places = placesFor(category)
  const left = places.filter((id) => id === null).length
  const isLast = screen === categories.length - 1
  return (
    // `data-festive` turns the page cranberry, with snow (AppLayout).
    <section
      data-festive
      className="flex h-[max(34rem,calc(100dvh-6.5rem))] flex-col gap-1 text-on-primary [&_:focus-visible]:outline-focus-inverse"
      aria-labelledby="category-heading"
    >
      <AppBarContent>
        <span className="truncate text-sm font-bold opacity-90 max-sm:hidden">{event.name}</span>
      </AppBarContent>
      <div className="flex items-end gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-wider text-accent-subtle uppercase">
            Category {screen + 1} of {categories.length}
          </p>
          <h1 id="category-heading" className="text-3xl sm:text-4xl">
            {category.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setScreen(screen - 1)}
          className="ml-auto min-h-11 min-w-11 shrink-0 rounded-control px-3 font-display font-semibold hover:bg-primary-hover"
        >
          <span aria-hidden="true">←</span>
          {/* Phones need the room for the category's name. */}
          <span className="max-sm:sr-only"> Back</span>
        </button>
      </div>
      <CategoryBallot
        // A fresh ballot (first cookie on screen) for each category.
        key={category.id}
        photo={category.photo}
        cookies={category.cookies}
        places={places}
        onChange={(next) => setMedals({ ...medals, [category.id]: next })}
        className="min-h-0 flex-1"
        footer={
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={left > 0}
            onClick={() => setScreen(screen + 1)}
            className="disabled:bg-transparent disabled:opacity-100 disabled:shadow-none disabled:ring-2 disabled:ring-primary-hover"
          >
            {left > 0
              ? `Give out ${left === 1 ? '1 more medal' : left === places.length ? `all ${left} medals` : `${left} more medals`} to go on`
              : isLast
                ? 'Review my votes'
                : 'Next category →'}
          </Button>
        }
      />
    </section>
  )
}
