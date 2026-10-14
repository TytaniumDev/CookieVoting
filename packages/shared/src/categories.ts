const normalise = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase()
const PLATE_NAME = /^plate (\d+)$/

/**
 * Names for `count` categories made by uploading plate photos in bulk: "Plate 1",
 * "Plate 2", … numbered on from the highest "Plate N" the event already has.
 */
export function plateNames(existingNames: readonly string[], count: number): string[] {
  const highest = Math.max(
    0,
    ...existingNames.map((name) => Number(PLATE_NAME.exec(normalise(name))?.[1] ?? 0)),
  )
  return Array.from({ length: count }, (_, i) => `Plate ${highest + i + 1}`)
}

/**
 * Category name suggestions from past events (PRD §6.3): names used before, most used
 * first, skipping names this event already has and keeping only those matching `query`.
 * Names are compared case-insensitively; the most common spelling is shown. Placeholder
 * "Plate N" names from bulk uploads are never suggested.
 */
export function suggestCategoryNames(
  pastNames: readonly string[],
  existingNames: readonly string[],
  query: string,
  limit = 6,
): string[] {
  const taken = new Set(existingNames.map(normalise))
  const wanted = normalise(query)
  const byKey = new Map<string, { count: number; spellings: Map<string, number> }>()

  for (const name of pastNames) {
    const key = normalise(name)
    if (!key || taken.has(key) || !key.includes(wanted) || PLATE_NAME.test(key)) continue
    const entry = byKey.get(key) ?? { count: 0, spellings: new Map() }
    const spelling = name.trim().replace(/\s+/g, ' ')
    entry.count++
    entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1)
    byKey.set(key, entry)
  }

  return [...byKey.values()]
    .map(({ count, spellings }) => ({
      count,
      name: [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry) => entry.name)
}
