import type { CategoryRanking, Cookie, PlatePhoto } from '@cookie-voting/shared'
import { Button } from '../Button/Button.tsx'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import type { Rank } from '../RankBadge/RankBadge.tsx'

export interface BallotReviewCategory {
  id: string
  name: string
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  cookies: readonly Cookie[]
}

export interface BallotReviewProps {
  categories: readonly BallotReviewCategory[]
  rankings: Readonly<Record<string, CategoryRanking>>
  onEdit: (categoryIndex: number) => void
  onSubmit: () => void
  submitting?: boolean
}

/** Every category's picks in one place before the ballot is sent. */
export function BallotReview({
  categories,
  rankings,
  onEdit,
  onSubmit,
  submitting = false,
}: BallotReviewProps) {
  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {categories.map((category, index) => {
          const ranking = rankings[category.id] ?? []
          return (
            <li
              key={category.id}
              className="rounded-card border border-border bg-surface p-3 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg">{category.name}</h3>
                <Button variant="ghost" onClick={() => onEdit(index)}>
                  Change<span className="sr-only"> {category.name}</span>
                </Button>
              </div>
              <ol className="mt-2 flex gap-3">
                {ranking.map((cookieId, pick) => {
                  const number = category.cookies.findIndex((c) => c.id === cookieId) + 1
                  const cookie = category.cookies[number - 1]
                  if (!cookie) return null
                  return (
                    <li key={cookieId}>
                      <CookieThumb
                        photo={category.photo}
                        cookie={cookie}
                        alt={`Cookie ${number}`}
                        rank={(pick + 1) as Rank}
                        className="w-20"
                      />
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ol>
      <Button size="lg" fullWidth loading={submitting} onClick={onSubmit}>
        Submit my votes
      </Button>
      <p className="text-center text-sm text-ink-muted">
        You can still change them afterwards, until the results open.
      </p>
    </div>
  )
}
