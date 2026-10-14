import type { CategoryResult, Cookie, CookieStanding, PlatePhoto } from '@cookie-voting/shared'
import { useId } from 'react'
import { Card } from '../Card/Card.tsx'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import { StandingRow } from '../StandingRow/StandingRow.tsx'
import { tiedRanks } from '../StandingRow/tiedRanks.ts'

export interface CategoryResultsProps {
  result: CategoryResult
  /** The category's plate, for the cookie pictures. Missing while it loads or once deleted. */
  plate?: { photo: Pick<PlatePhoto, 'url' | 'width' | 'height'> | null; cookies: readonly Cookie[] }
  /** Makes each cookie a button, e.g. to show its votes. */
  onSelect?: (standing: CookieStanding) => void
}

/** Every cookie in one category, best first, with its baker and Borda points (PRD §9). */
export function CategoryResults({ result, plate, onSelect }: CategoryResultsProps) {
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
                      <CookieThumb
                        photo={photo}
                        cookie={cookie}
                        alt=""
                        round
                        className="w-14 shrink-0"
                      />
                    )
                  }
                  onSelect={onSelect && (() => onSelect(standing))}
                  selectHint="See its votes"
                />
              )
            })}
          </ol>
        )}
      </section>
    </Card>
  )
}
