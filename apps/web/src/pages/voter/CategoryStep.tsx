import type { CategoryPlaces } from '@cookie-voting/shared'
import { AppBarContent } from '../../app/AppBarSlot.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { CategoryBallot } from '../../components/CategoryBallot/CategoryBallot.tsx'
import type { VotableCategory } from './BallotFlow.tsx'

export interface CategoryStepProps {
  eventName: string
  /** Above the category's name, e.g. "Category 2 of 6". */
  eyebrow: string
  category: VotableCategory
  places: CategoryPlaces
  onChange: (places: CategoryPlaces) => void
  onBack: () => void
  /** The main button once every medal is given, e.g. "Next category →". */
  doneLabel: string
  onDone: () => void
  busy?: boolean
}

/**
 * One category's ballot on the festive cranberry page: its name, the cookies to give
 * medals to, then a button that waits until every medal is given (owner decision Q3).
 * Used while voting and when changing a category from the waiting screen.
 */
export function CategoryStep({
  eventName,
  eyebrow,
  category,
  places,
  onChange,
  onBack,
  doneLabel,
  onDone,
  busy = false,
}: CategoryStepProps) {
  const left = places.filter((id) => id === null).length
  return (
    // `data-festive` turns the page cranberry, with snow (AppLayout).
    <section
      data-festive
      className="flex h-[max(34rem,calc(100dvh-6.5rem))] flex-col gap-1 text-on-primary [&_:focus-visible]:outline-focus-inverse"
      aria-labelledby="category-heading"
    >
      <AppBarContent>
        <span className="truncate text-sm font-bold opacity-90 max-sm:hidden">{eventName}</span>
      </AppBarContent>
      <div className="flex items-end gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-wider text-accent-subtle uppercase">
            {eyebrow}
          </p>
          <h1 id="category-heading" className="text-3xl sm:text-4xl">
            {category.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={onBack}
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
        onChange={onChange}
        className="min-h-0 flex-1"
        footer={
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={left > 0}
            loading={busy}
            onClick={onDone}
            className="disabled:bg-transparent disabled:opacity-100 disabled:shadow-none disabled:ring-2 disabled:ring-primary-hover"
          >
            {left > 0
              ? `Give out ${left === 1 ? '1 more medal' : left === places.length ? `all ${left} medals` : `${left} more medals`} to go on`
              : doneLabel}
          </Button>
        }
      />
    </section>
  )
}
