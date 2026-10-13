import { describe, expect, it } from 'vitest'
import type { CategoryDoc, SetupDoc } from './documents.ts'
import { removeBakerFromSetup, setupProgress } from './setup.ts'

const box = { x: 0, y: 0, width: 0.1, height: 0.1 }
const photo = { path: 'p', url: 'u', width: 10, height: 10 }
const category = (cookieIds: string[], withPhoto = true): CategoryDoc => ({
  name: 'C',
  order: 0,
  photo: withPhoto ? photo : null,
  cookies: cookieIds.map((id) => ({ id, box })),
})

describe('setupProgress', () => {
  it('starts at bakers for a brand-new event', () => {
    const progress = setupProgress({
      status: 'setup',
      setup: null,
      categories: [],
      categoryIds: [],
    })
    expect(progress.current).toBe('bakers')
    expect(progress.readyToVote).toBe(false)
    expect(Object.values(progress.done).every((done) => !done)).toBe(true)
  })

  it('marks each step done from the data', () => {
    const setup: SetupDoc = { bakerIds: ['ann'], assignments: { a: { a1: 'ann' } } }
    const progress = setupProgress({
      status: 'setup',
      setup,
      categories: [category(['a1'])],
      categoryIds: ['a'],
    })
    expect(progress.done).toMatchObject({
      bakers: true,
      categories: true,
      cookies: true,
      assign: true,
    })
    expect(progress.current).toBe('voting')
    expect(progress.readyToVote).toBe(true)
  })

  it('needs a photo on every category and a cookie in every category', () => {
    const progress = setupProgress({
      status: 'setup',
      setup: { bakerIds: ['ann'], assignments: {} },
      categories: [category(['a1']), category([], false)],
      categoryIds: ['a', 'b'],
    })
    expect(progress.done.categories).toBe(false)
    expect(progress.done.cookies).toBe(false)
    expect(progress.current).toBe('categories')
  })

  it('counts cookies assigned to bakers who left the roster as unassigned', () => {
    const progress = setupProgress({
      status: 'setup',
      setup: { bakerIds: ['ann'], assignments: { a: { a1: 'ann', a2: 'bob' } } },
      categories: [category(['a1', 'a2', 'a3'])],
      categoryIds: ['a'],
    })
    expect(progress.unassignedCookies).toBe(2)
    expect(progress.done.assign).toBe(false)
    expect(progress.readyToVote).toBe(false)
  })

  it('reflects voting and results from the status, whatever the setup', () => {
    const progress = setupProgress({
      status: 'results',
      setup: null,
      categories: [],
      categoryIds: [],
    })
    expect(progress.done.voting).toBe(true)
    expect(progress.done.results).toBe(true)
    expect(progress.current).toBe('bakers')
  })
})

describe('removeBakerFromSetup', () => {
  it('drops the baker and unassigns their cookies only', () => {
    const setup: SetupDoc = {
      bakerIds: ['ann', 'bob'],
      assignments: { a: { a1: 'ann', a2: 'bob' }, b: { b1: 'ann' } },
    }
    expect(removeBakerFromSetup(setup, 'ann')).toEqual({
      bakerIds: ['bob'],
      assignments: { a: { a2: 'bob' }, b: {} },
    })
  })
})
