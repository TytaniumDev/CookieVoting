// Runs against the emulators with the functions loaded (npm run test:emulators).
import { paths, type ResultsDoc } from '@cookie-voting/shared'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { recomputeResults } from '../src/recomputeResults.ts'

const PROJECT_ID = 'demo-cookie-voting'
let app: App
let db: Firestore
let eventId: string
let eventCounter = 0

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'results-test')
  db = getFirestore(app)
})

afterAll(() => deleteApp(app))

beforeEach(async () => {
  // A fresh event per test keeps triggers from earlier tests out of the way.
  eventId = `results-test-${Date.now()}-${eventCounter++}`
  const now = Timestamp.now()
  const batch = db.batch()
  batch.set(db.doc(paths.baker('ann')), { name: 'Ann', createdAt: now })
  batch.set(db.doc(paths.baker('bob')), { name: 'Bob', createdAt: now })
  batch.set(db.doc(paths.event(eventId)), {
    name: 'Test',
    status: 'voting',
    createdAt: now,
    updatedAt: now,
  })
  batch.set(db.doc(paths.category(eventId, 'choc')), {
    name: 'Chocolate',
    order: 0,
    photo: null,
    cookies: ['c1', 'c2', 'c3'].map((id) => ({ id, box: { x: 0, y: 0, width: 0.1, height: 0.1 } })),
  })
  batch.set(db.doc(paths.setup(eventId)), {
    bakerIds: ['ann', 'bob'],
    assignments: { choc: { c1: 'ann', c2: 'bob', c3: 'bob' } },
  })
  await batch.commit()
})

async function readResults(): Promise<ResultsDoc<Timestamp> | undefined> {
  return (await db.doc(paths.results(eventId)).get()).data() as ResultsDoc<Timestamp> | undefined
}

/** Waits for the trigger-written results to satisfy `predicate`. */
async function waitForResults(
  predicate: (results: ResultsDoc<Timestamp>) => boolean,
): Promise<ResultsDoc<Timestamp>> {
  const deadline = Date.now() + 15_000
  for (;;) {
    const results = await readResults()
    if (results && predicate(results)) return results
    if (Date.now() > deadline)
      throw new Error(`Timed out; last results: ${JSON.stringify(results)}`)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

function castBallot(uid: string, picks: string[]) {
  return db.doc(paths.ballot(eventId, uid)).set({
    rankings: { choc: picks },
    submittedAt: Timestamp.now(),
  })
}

describe('results triggers', () => {
  it('recompute when a ballot is cast', async () => {
    await castBallot('v1', ['c1', 'c2', 'c3'])
    const results = await waitForResults((r) => r.ballotCount === 1)
    expect(results.categories[0]?.standings.map((s) => [s.cookieId, s.points])).toEqual([
      ['c1', 3],
      ['c2', 2],
      ['c3', 1],
    ])
    expect(results.bakers.map((b) => [b.name, b.points, b.rank])).toEqual([
      ['Ann', 3, 1],
      ['Bob', 3, 1],
    ])
  })

  it('recompute when baker assignments change', async () => {
    await castBallot('v1', ['c1', 'c2', 'c3'])
    await waitForResults((r) => r.ballotCount === 1)
    await db.doc(paths.setup(eventId)).update({ 'assignments.choc.c1': 'bob' })
    const results = await waitForResults((r) => r.bakers[0]?.name === 'Bob')
    expect(results.bakers.map((b) => [b.name, b.points])).toEqual([
      ['Bob', 6],
      ['Ann', 0],
    ])
  })

  it('recompute when cookies change', async () => {
    await castBallot('v1', ['c1', 'c2', 'c3'])
    await waitForResults((r) => r.ballotCount === 1)
    await db.doc(paths.category(eventId, 'choc')).update({
      cookies: [{ id: 'c2', box: { x: 0, y: 0, width: 0.1, height: 0.1 } }],
    })
    const results = await waitForResults((r) => r.categories[0]?.standings.length === 1)
    // sanitizeRanking drops the removed cookie, so c2 moves up to first place.
    expect(results.categories[0]?.standings[0]).toMatchObject({ cookieId: 'c2', points: 3 })
  })
})

describe('recomputeResults', () => {
  it("doesn't let concurrent recomputes regress the ballot count", async () => {
    const voters = Array.from({ length: 12 }, (_, i) => `v${i}`)
    // Interleave ballots with recomputes started directly (on top of the triggers).
    await Promise.all(
      voters.map(async (uid) => {
        await castBallot(uid, ['c3', 'c2', 'c1'])
        await recomputeResults(db, eventId)
      }),
    )
    await recomputeResults(db, eventId)
    const results = await waitForResults((r) => r.ballotCount === voters.length)
    expect(results.categories[0]?.standings[0]).toMatchObject({ cookieId: 'c3', points: 36 })
  })

  it('skips writing results computed from an older snapshot', async () => {
    await db.doc(paths.results(eventId)).set({
      ballotCount: 99,
      categories: [],
      bakers: [],
      updatedAt: Timestamp.now(),
      sourceReadTime: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
    })
    expect(await recomputeResults(db, eventId)).toBe('skipped-stale')
    expect((await readResults())?.ballotCount).toBe(99)
  })
})
