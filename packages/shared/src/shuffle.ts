/** FNV-1a: a quick, well-spread 32-bit hash of a string. Not for security. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Spread the last characters' bits (ids often differ only at the end).
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return h >>> 0
}

/**
 * The items in an order that looks random but is the same every time for the same
 * `seed` (e.g. a voter's id), so a voter's cookies don't jump around on reload. Each
 * item's place comes from its own id, so adding or removing one leaves the rest in order.
 */
export function stableShuffle<T>(
  items: readonly T[],
  seed: string,
  idOf: (item: T) => string,
): T[] {
  return items
    .map((item) => ({ item, key: hash(`${seed}\u0000${idOf(item)}`) }))
    .sort((a, b) => a.key - b.key || (idOf(a.item) < idOf(b.item) ? -1 : 1))
    .map(({ item }) => item)
}
