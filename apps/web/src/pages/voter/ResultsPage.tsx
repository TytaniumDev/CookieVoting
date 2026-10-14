import type { Cookie, CookieStanding, PlatePhoto } from '@cookie-voting/shared'
import { useCallback, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { AppBarContent } from '../../app/AppBarSlot.tsx'
import { Alert } from '../../components/Alert/Alert.tsx'
import { BakerLeaderboard } from '../../components/BakerLeaderboard/BakerLeaderboard.tsx'
import { buttonClasses } from '../../components/Button/buttonClasses.ts'
import { Card } from '../../components/Card/Card.tsx'
import { CategoryResults } from '../../components/CategoryResults/CategoryResults.tsx'
import { CookieThumb } from '../../components/CookieThumb/CookieThumb.tsx'
import type { OrnamentItem } from '../../components/Ornaments/Ornaments.tsx'
import type { RevealMode } from '../../components/Ornaments/useReveal.ts'
import { SlideShow, type Slide } from '../../components/SlideShow/SlideShow.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { tiedRanks } from '../../components/StandingRow/tiedRanks.ts'
import {
  VoteBreakdown,
  type VoteBreakdownProps,
} from '../../components/VoteBreakdown/VoteBreakdown.tsx'
import { useCategories, useEvent, useResults } from '../../lib/data.ts'
import { RevealSlide } from './RevealSlide.tsx'

type Plate = {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'> | null
  cookies: readonly Cookie[]
}

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`

/** A cookie as a round photo, or a plain cookie when its plate hasn't loaded. */
function picture(plate: Plate | undefined, cookieId: string): ReactNode {
  const cookie = plate?.cookies.find((c) => c.id === cookieId)
  if (!plate?.photo || !cookie) {
    return (
      <span className="grid aspect-square w-full place-items-center rounded-full bg-surface-muted text-4xl">
        🍪
      </span>
    )
  }
  return <CookieThumb photo={plate.photo} cookie={cookie} alt="" round className="w-full" />
}

/**
 * The results (PRD §9), festive (owner decision 2026-10-14): one slide per category with
 * its top three as ornaments on a garland, opened by a timed reveal; then the top bakers;
 * then every cookie and baker in one scrolling list. Tapping a cookie shows its votes.
 * Updates live as late votes come in. Before results open it says so, and switches over
 * by itself when they do.
 */
export function ResultsPage() {
  const { eventId = '' } = useParams()
  const event = useEvent(eventId)
  const open = event.status === 'ready' && event.data?.status === 'results'
  // Only listen once results are open: until then the rules deny the read.
  const results = useResults(open ? eventId : null)
  const categories = useCategories(eventId)
  const [shown, setShown] = useState(0)
  // Slides whose reveal has played (or been skipped): they stay open.
  const [finished, setFinished] = useState<ReadonlySet<string>>(new Set())
  const [selected, setSelected] = useState<{ categoryId: string; cookieId: string } | null>(null)
  const finish = useCallback(
    (id: string) => setFinished((done) => (done.has(id) ? done : new Set(done).add(id))),
    [],
  )

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
  const plates = new Map<string, Plate>(
    categories.status === 'ready' ? categories.data.map((c) => [c.id, c] as const) : [],
  )
  const resultCategories = results.data.categories

  const cookieItem = (
    categoryId: string,
    standing: CookieStanding,
    tied: boolean,
  ): OrnamentItem => ({
    id: standing.cookieId,
    rank: standing.rank,
    tied,
    name: standing.bakerName ?? 'No baker',
    detail: pts(standing.points),
    picture: picture(plates.get(categoryId), standing.cookieId),
  })

  // Each baker's best cookie is their picture on the Top bakers slide.
  const bestCookie = new Map<string, { categoryId: string; cookieId: string; points: number }>()
  for (const category of resultCategories) {
    for (const s of category.standings) {
      const best = s.bakerId === null ? undefined : bestCookie.get(s.bakerId)
      if (s.bakerId !== null && (!best || s.points > best.points)) {
        bestCookie.set(s.bakerId, {
          categoryId: category.categoryId,
          cookieId: s.cookieId,
          points: s.points,
        })
      }
    }
  }
  const bakerTies = tiedRanks(bakers)
  const bakerItems: OrnamentItem[] = bakers.slice(0, 3).map((baker) => {
    const best = bestCookie.get(baker.bakerId)
    return {
      id: baker.bakerId,
      rank: baker.rank,
      tied: bakerTies.has(baker.rank),
      name: baker.name,
      detail: `${pts(baker.points)} in all`,
      picture: best ? picture(plates.get(best.categoryId), best.cookieId) : picture(undefined, ''),
    }
  })

  const slideIds = [...resultCategories.map((c) => c.categoryId), 'top-bakers', 'all']
  const modeOf = (id: string): RevealMode =>
    finished.has(id) ? 'done' : slideIds[shown] === id ? 'play' : 'wait'
  // Leaving a slide mid-reveal finishes it, so it's open when the voter comes back.
  const go = (index: number) => {
    const leaving = slideIds[shown]
    if (leaving && index !== shown) finish(leaving)
    setShown(index)
  }

  const slides: Slide[] = [
    ...resultCategories.map((category) => {
      const ties = tiedRanks(category.standings)
      return {
        id: category.categoryId,
        label: category.name,
        content: (
          <RevealSlide
            title={category.name}
            items={category.standings
              .slice(0, 3)
              .map((s) => cookieItem(category.categoryId, s, ties.has(s.rank)))}
            mode={modeOf(category.categoryId)}
            onDone={() => finish(category.categoryId)}
            onSelect={(cookieId) => setSelected({ categoryId: category.categoryId, cookieId })}
            empty="No cookies in this category."
          />
        ),
      }
    }),
    {
      id: 'top-bakers',
      label: '🏆 Top bakers',
      content: (
        <RevealSlide
          title="Top bakers"
          items={bakerItems}
          mode={modeOf('top-bakers')}
          onDone={() => finish('top-bakers')}
          empty="No bakers yet."
        />
      ),
    },
    {
      id: 'all',
      label: '📜 All results',
      content: (
        <section aria-labelledby="all-results-heading" className="flex min-h-0 flex-1 flex-col">
          <h2 id="all-results-heading" className="text-center text-3xl sm:text-4xl">
            All results
          </h2>
          <div className="-mx-1 mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1 pb-4 text-ink *:shrink-0">
            {resultCategories.map((result) => (
              <CategoryResults
                key={result.categoryId}
                result={result}
                plate={plates.get(result.categoryId)}
                onSelect={(s) =>
                  setSelected({ categoryId: result.categoryId, cookieId: s.cookieId })
                }
              />
            ))}
            <BakerLeaderboard bakers={bakers} />
          </div>
        </section>
      ),
    },
  ]

  const breakdown = (): VoteBreakdownProps['cookie'] => {
    if (!selected) return null
    const category = resultCategories.find((c) => c.categoryId === selected.categoryId)
    const standing = category?.standings.find((s) => s.cookieId === selected.cookieId)
    // Results computed before vote counts were kept have no breakdown until the next vote.
    if (!category || !standing?.votes) return null
    return {
      picture: picture(plates.get(category.categoryId), standing.cookieId),
      name: standing.bakerName ?? 'No baker',
      category: category.name,
      rank: standing.rank,
      tied: tiedRanks(category.standings).has(standing.rank),
      points: standing.points,
      votes: standing.votes,
      voters: category.ballotCount ?? ballotCount,
    }
  }

  return (
    // `data-festive` turns the page cranberry, with snow (AppLayout).
    <section
      data-festive
      aria-labelledby="results-heading"
      className="flex h-[max(34rem,calc(100dvh-6.5rem))] flex-col gap-1 text-on-primary [&_:focus-visible]:outline-focus-inverse"
    >
      <AppBarContent>
        <span className="truncate text-sm font-bold opacity-90 max-sm:hidden">{current.name}</span>
      </AppBarContent>
      <h1
        id="results-heading"
        className="text-center font-sans text-sm font-extrabold tracking-wider text-accent-subtle uppercase"
      >
        The results are in · {ballotCount} {ballotCount === 1 ? 'vote' : 'votes'}
      </h1>
      <SlideShow
        label="Results"
        slides={slides}
        current={shown}
        onCurrentChange={go}
        className="min-h-0 flex-1"
      />
      <VoteBreakdown cookie={breakdown()} onClose={() => setSelected(null)} />
    </section>
  )
}
