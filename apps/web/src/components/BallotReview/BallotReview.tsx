import type { CategoryRanking, Cookie, PlatePhoto } from '@cookie-voting/shared'
import { Button } from '../Button/Button.tsx'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

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

/** Every category's picks in one place before the ballot is sent (it can't be changed after). */
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
                    <li key={cookieId} className="relative w-20">
                      <span className="grid aspect-square place-items-center overflow-hidden rounded-control bg-surface-muted">
                        <CookieImage
                          photo={category.photo}
                          box={cookie.box}
                          alt={`Cookie ${number}`}
                          style={{
                            width: `${Math.min(1, (cookie.box.width * category.photo.width) / (cookie.box.height * category.photo.height)) * 100}%`,
                          }}
                        />
                      </span>
                      <RankBadge rank={(pick + 1) as Rank} className="absolute -top-2 -left-2" />
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
      <p className="text-center text-sm text-ink-muted">You can't change your votes after this.</p>
    </div>
  )
}
