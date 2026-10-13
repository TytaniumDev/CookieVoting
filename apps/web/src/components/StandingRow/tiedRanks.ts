/** Ties share a rank, so a rank that appears more than once is a tie. */
export function tiedRanks(standings: readonly { rank: number }[]): Set<number> {
  const seen = new Set<number>()
  const tied = new Set<number>()
  for (const { rank } of standings) {
    if (seen.has(rank)) tied.add(rank)
    seen.add(rank)
  }
  return tied
}
