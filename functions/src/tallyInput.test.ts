import type { CategoryDoc } from '@cookie-voting/shared'
import { describe, expect, it } from 'vitest'
import { buildTallyInput } from './tallyInput.ts'

const category = (name: string, order: number, cookieIds: string[]): CategoryDoc => ({
  name,
  order,
  photo: null,
  cookies: cookieIds.map((id) => ({ id, box: { x: 0, y: 0, width: 0.1, height: 0.1 } })),
})

describe('buildTallyInput', () => {
  it('orders categories by `order` and lists cookie ids in display order', () => {
    const input = buildTallyInput({
      categories: [
        { id: 'b', data: category('Bars', 2, ['b1']) },
        { id: 'a', data: category('Chocolate', 1, ['a2', 'a1']) },
      ],
      setup: undefined,
      bakerNames: new Map(),
      ballots: [],
    })
    expect(input.categories).toEqual([
      { id: 'a', name: 'Chocolate', cookieIds: ['a2', 'a1'] },
      { id: 'b', name: 'Bars', cookieIds: ['b1'] },
    ])
    expect(input.assignments).toEqual({})
  })

  it('keeps only roster bakers that still exist', () => {
    const input = buildTallyInput({
      categories: [],
      setup: { bakerIds: ['ann', 'gone'], assignments: { a: { a1: 'ann' } } },
      bakerNames: new Map([
        ['ann', 'Ann'],
        ['bob', 'Bob'],
      ]),
      ballots: [{ a: ['a1'] }],
    })
    expect(input.bakers).toEqual({ ann: 'Ann' })
    expect(input.assignments).toEqual({ a: { a1: 'ann' } })
    expect(input.ballots).toHaveLength(1)
  })
})
