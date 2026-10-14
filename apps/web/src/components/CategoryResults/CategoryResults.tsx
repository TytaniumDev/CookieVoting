import type { CategoryResult, Cookie, PlatePhoto } from '@cookie-voting/shared'
import { useId } from 'react'
import { Card } from '../Card/Card.tsx'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { StandingRow } from '../StandingRow/StandingRow.tsx'
import { tiedRanks } from '../StandingRow/tiedRanks.ts'

export interface CategoryResultsProps {
  result: CategoryResult
  /** The category's plate, for the cookie pictures. Missing while it loads or once deleted. */
  plate?: { photo: Pick<PlatePhoto, 'url' | 'width' | 'height'> | null; cookies: readonly Cookie[] }
}

/** Every cookie in one category, best first, with its baker and Borda points (PRD §9). */
export function CategoryResults({ result, plate }: CategoryResultsProps) {
  const headingId = useId()
  const tied = tiedRanks(result.standings)
  return (
    <Card>
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="text-2xl">
          {result.name}
        </h2>
        {result.standings.length === 0 ? (
          <p className="text-ink-muted">No cookies in this category.</p>
        ) : (
          <ol className="divide-y divide-border">
            {result.standings.map((standing) => {
              const cookie = plate?.cookies.find((c) => c.id === standing.cookieId)
              const photo = plate?.photo
              return (
                <StandingRow
                  key={standing.cookieId}
                  rank={standing.rank}
                  tied={tied.has(standing.rank)}
                  title={standing.bakerName ?? 'No baker'}
                  points={standing.points}
                  image={
                    cookie &&
                    photo && (
                      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-muted">
                        <CookieImage
                          photo={photo}
                          box={cookie.box}
                          alt=""
                          style={{
                            width: `${Math.min(1, (cookie.box.width * photo.width) / (cookie.box.height * photo.height)) * 100}%`,
                          }}
                        />
                      </span>
                    )
                  }
                />
              )
            })}
          </ol>
        )}
      </section>
    </Card>
  )
}
