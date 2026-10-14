import { describe, expect, it } from 'vitest'
import { stableShuffle } from './shuffle.ts'

const ids = Array.from({ length: 8 }, (_, i) => `cookie-${i + 1}`)
const id = (s: string) => s

describe('stableShuffle', () => {
  it('keeps every item once', () => {
    expect([...stableShuffle(ids, 'voter-a', id)].sort()).toEqual([...ids].sort())
  })

  it('gives the same order for the same seed', () => {
    expect(stableShuffle(ids, 'voter-a', id)).toEqual(
      stableShuffle([...ids].reverse(), 'voter-a', id),
    )
  })

  it('gives different voters different orders', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) => stableShuffle(ids, `voter-${i}`, id).join()),
    )
    expect(orders.size).toBeGreaterThan(15)
  })

  it('puts each item first about as often as the others', () => {
    const firsts = new Map<string, number>()
    for (let i = 0; i < 4000; i++) {
      const first = stableShuffle(ids, `uid-${i}`, id)[0]!
      firsts.set(first, (firsts.get(first) ?? 0) + 1)
    }
    // 500 each on average.
    for (const item of ids) expect(firsts.get(item)).toBeGreaterThan(400)
  })

  it('leaves the others in order when an item is added or removed', () => {
    const before = stableShuffle(ids, 'voter-a', id)
    const after = stableShuffle([...ids.slice(1), 'cookie-new'], 'voter-a', id)
    const kept = (order: string[]) => order.filter((c) => c !== 'cookie-1' && c !== 'cookie-new')
    expect(kept(after)).toEqual(kept(before))
  })
})
