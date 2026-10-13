import type { BallotRankings, CategoryDoc, SetupDoc, TallyInput } from '@cookie-voting/shared'

export interface EventSnapshot {
  /** Categories with their ids, in any order. */
  categories: ReadonlyArray<{ id: string; data: CategoryDoc }>
  setup: SetupDoc | undefined
  /** bakerId -> name, for the bakers on the roster that still exist. */
  bakerNames: ReadonlyMap<string, string>
  ballots: readonly BallotRankings[]
}

/** Turns raw Firestore data into the input `tallyResults` expects. */
export function buildTallyInput(snapshot: EventSnapshot): TallyInput {
  const categories = [...snapshot.categories]
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data }) => ({
      id,
      name: data.name,
      cookieIds: (data.cookies ?? []).map((cookie) => cookie.id),
    }))

  const bakers: Record<string, string> = {}
  for (const bakerId of snapshot.setup?.bakerIds ?? []) {
    const name = snapshot.bakerNames.get(bakerId)
    if (name !== undefined) bakers[bakerId] = name
  }

  return {
    categories,
    assignments: snapshot.setup?.assignments ?? {},
    bakers,
    ballots: snapshot.ballots,
  }
}
