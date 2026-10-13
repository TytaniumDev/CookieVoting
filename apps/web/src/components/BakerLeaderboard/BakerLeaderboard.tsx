import type { BakerStanding } from '@cookie-voting/shared'
import { useId } from 'react'
import { Card } from '../Card/Card.tsx'
import { StandingRow } from '../StandingRow/StandingRow.tsx'
import { tiedRanks } from '../StandingRow/tiedRanks.ts'

export interface BakerLeaderboardProps {
  bakers: readonly BakerStanding[]
}

/** Every baker ranked by their total Borda points across all categories (PRD §9). */
export function BakerLeaderboard({ bakers }: BakerLeaderboardProps) {
  const headingId = useId()
  const tied = tiedRanks(bakers)
  return (
    <Card tone="festive">
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="text-2xl">
          Top bakers
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
                points={baker.points}
              />
            ))}
          </ol>
        )}
      </section>
    </Card>
  )
}
