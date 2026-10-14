import { describe, expect, it } from 'vitest'
import { mergeCookieEdits, removedCookieIds } from './cookies.ts'

const cookie = (id: string, x: number, y = 0.1) => ({ id, box: { x, y, width: 0.1, height: 0.1 } })

describe('mergeCookieEdits', () => {
  const a = cookie('a', 0.1)
  const b = cookie('b', 0.3)

  it('keeps cookies another device added meanwhile', () => {
    const mine = cookie('mine', 0.5)
    const theirs = cookie('theirs', 0.7)
    expect(mergeCookieEdits([a], [a, mine], [a, theirs])).toEqual([a, mine, theirs])
  })

  it('applies a move without undoing a move made elsewhere', () => {
    const aMoved = cookie('a', 0.15)
    const bMoved = cookie('b', 0.35)
    expect(mergeCookieEdits([a, b], [aMoved, b], [a, bMoved])).toEqual([aMoved, bMoved])
  })

  it('removes what this edit removed and keeps what it left alone', () => {
    expect(mergeCookieEdits([a, b], [b], [a, b])).toEqual([b])
    expect(mergeCookieEdits([a, b], [a, b], [a])).toEqual([a])
  })

  it("doesn't bring back a cookie someone else deleted", () => {
    expect(mergeCookieEdits([a, b], [cookie('a', 0.15), b], [b])).toEqual([b])
  })

  it('keeps the result in reading order', () => {
    const below = cookie('below', 0.1, 0.5)
    const right = cookie('right', 0.6)
    expect(mergeCookieEdits([], [below], [right]).map((c) => c.id)).toEqual(['right', 'below'])
  })

  it('adds a cookie only once if the save is replayed', () => {
    const mine = cookie('mine', 0.5)
    expect(mergeCookieEdits([a], [a, mine], [a, mine])).toEqual([a, mine])
  })
})

describe('removedCookieIds', () => {
  it('lists cookies in base that next dropped', () => {
    expect(removedCookieIds([cookie('a', 0), cookie('b', 0.2)], [cookie('b', 0.2)])).toEqual(['a'])
  })
})
