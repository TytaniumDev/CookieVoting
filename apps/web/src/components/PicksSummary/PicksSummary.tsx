import type { CategoryRanking } from '@cookie-voting/shared'
import type { BallotReviewCategory } from '../BallotReview/BallotReview.tsx'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import type { Rank } from '../RankBadge/RankBadge.tsx'

export interface PicksSummaryProps {
  categories: readonly BallotReviewCategory[]
  /** The ballot as sent; a category added since has no entry. */
  rankings: Readonly<Record<string, CategoryRanking | undefined>>
  /** Opens a category to change it; left out once picks can't change (results are open). */
  onEdit?: (categoryId: string) => void
  className?: string
}

/**
 * A voter's sent picks, a row per category with the cookies' photos and medals. With
 * `onEdit`, tapping a row opens that category to change it; without, the rows are read-only.
 */
export function PicksSummary({ categories, rankings, onEdit, className = '' }: PicksSummaryProps) {
  return (
    <section
      aria-labelledby="picks-heading"
      className={`rounded-card border border-border bg-surface p-4 shadow-card sm:p-6 ${className}`}
    >
      <h2 id="picks-heading" className="text-xl">
        Your picks
      </h2>
      {onEdit && <p className="text-sm text-ink-muted">Tap a category to change it.</p>}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          // Admins can delete cookies while people vote.
          const picks = (rankings[category.id] ?? []).flatMap((id) => {
            const index = category.cookies.findIndex((c) => c.id === id)
            const cookie = category.cookies[index]
            return cookie ? [{ cookie, number: index + 1 }] : []
          })
          const thumbs =
            picks.length > 0 ? (
              <span className="flex gap-3 pt-1 pl-1">
                {picks.map(({ cookie, number }, pick) => (
                  <CookieThumb
                    key={cookie.id}
                    photo={category.photo}
                    cookie={cookie}
                    alt={`Cookie ${number}`}
                    rank={(pick + 1) as Rank}
                    badgeSize="sm"
                    className="w-16"
                  />
                ))}
              </span>
            ) : (
              <span className="text-sm text-ink-muted">No votes here yet.</span>
            )
          const name = (
            <span className="min-w-0 font-display text-lg font-semibold">{category.name}</span>
          )
          if (!onEdit) {
            return (
              <li
                key={category.id}
                className="flex flex-col gap-3 rounded-control border border-border bg-background p-3"
              >
                {name}
                {thumbs}
              </li>
            )
          }
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onEdit(category.id)}
                aria-label={`${picks.length > 0 ? 'Change' : 'Vote in'} ${category.name}`}
                className="flex size-full flex-col gap-3 rounded-control border border-border bg-background p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-muted"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  {name}
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {picks.length > 0 ? 'Change' : 'Vote'} <span aria-hidden="true">›</span>
                  </span>
                </span>
                {thumbs}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
