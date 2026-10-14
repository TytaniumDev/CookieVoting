import type { BakerStanding } from '@cookie-voting/shared'
import { useId, type ReactNode } from 'react'
import { Card } from '../Card/Card.tsx'
import { StandingRow } from '../StandingRow/StandingRow.tsx'
import { tiedRanks } from '../StandingRow/tiedRanks.ts'

export interface BakerLeaderboardProps {
  bakers: readonly BakerStanding[]
  /** How many cookies each baker entered, shown under their name. */
  cookieCount?: (bakerId: string) => number
  /** Shown beside each baker, e.g. their best cookie. */
  image?: (baker: BakerStanding) => ReactNode
  /** Makes each baker a button, e.g. to list their cookies. */
  onSelect?: (baker: BakerStanding) => void
}

const cookiesText = (n: number) => `${n} ${n === 1 ? 'cookie' : 'cookies'}`

/** Every baker ranked by their total Borda points across all categories (PRD §9). */
export function BakerLeaderboard({ bakers, cookieCount, image, onSelect }: BakerLeaderboardProps) {
  const headingId = useId()
  const tied = tiedRanks(bakers)
  return (
    <Card tone="festive">
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="text-2xl">
          Bakers
        </h2>
        {bakers.length === 0 ? (
          <p className="text-ink-muted">No bakers yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {bakers.map((baker) => (
              <StandingRow
                key={baker.bakerId}
                rank={baker.rank}
                tied={tied.has(baker.rank)}
                title={baker.name}
                subtitle={cookieCount && cookiesText(cookieCount(baker.bakerId))}
                points={baker.points}
                image={image?.(baker)}
                onSelect={onSelect && (() => onSelect(baker))}
                selectHint="See their cookies"
              />
            ))}
          </ol>
        )}
      </section>
    </Card>
  )
}
