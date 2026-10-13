import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const ADMIN_EMAIL = 'santa@example.com'
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cookie-voting-rules',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, `admins/${ADMIN_EMAIL}`), { addedAt: Timestamp.now() })
    await setDoc(doc(db, 'bakers/ann'), { name: 'Ann', createdAt: Timestamp.now() })
    await seedEvent(db, 'setup-event', 'setup')
    await seedEvent(db, 'voting-event', 'voting')
    await seedEvent(db, 'results-event', 'results')
  })
})

type TestFirestore = ReturnType<RulesTestContext['firestore']>

async function seedEvent(db: TestFirestore, eventId: string, status: string) {
  const now = Timestamp.now()
  await setDoc(doc(db, `events/${eventId}`), {
    name: eventId,
    status,
    createdAt: now,
    updatedAt: now,
  })
  await setDoc(doc(db, `events/${eventId}/categories/choc`), {
    name: 'Chocolate',
    order: 0,
    photo: null,
    cookies: [],
  })
  await setDoc(doc(db, `events/${eventId}/private/setup`), { bakerIds: ['ann'], assignments: {} })
  await setDoc(doc(db, `events/${eventId}/results/live`), { ballotCount: 0 })
}

const admin = () =>
  env.authenticatedContext('admin-uid', { email: ADMIN_EMAIL, email_verified: true }).firestore()
const adminWithCapitalisedEmail = () =>
  env
    .authenticatedContext('admin-uid', { email: 'Santa@Example.com', email_verified: true })
    .firestore()
const unverifiedAdmin = () =>
  env.authenticatedContext('admin-uid', { email: ADMIN_EMAIL, email_verified: false }).firestore()
const googleUser = () =>
  env
    .authenticatedContext('grinch-uid', { email: 'grinch@example.com', email_verified: true })
    .firestore()
const voter = (uid = 'voter-1') =>
  env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore()
const anonymous = () => env.unauthenticatedContext().firestore()

const ballot = { rankings: { choc: ['c1', 'c2', 'c3'] }, submittedAt: serverTimestamp() }

describe('admins', () => {
  it('lets a signed-in user read only their own entry', async () => {
    await assertSucceeds(getDoc(doc(admin(), `admins/${ADMIN_EMAIL}`)))
    await assertSucceeds(getDoc(doc(adminWithCapitalisedEmail(), `admins/${ADMIN_EMAIL}`)))
    await assertSucceeds(getDoc(doc(googleUser(), 'admins/grinch@example.com')))
    await assertFails(getDoc(doc(googleUser(), `admins/${ADMIN_EMAIL}`)))
    await assertFails(getDoc(doc(anonymous(), `admins/${ADMIN_EMAIL}`)))
  })

  it('lets only admins add admins', async () => {
    await assertSucceeds(
      setDoc(doc(admin(), 'admins/elf@example.com'), { addedAt: serverTimestamp() }),
    )
    await assertFails(
      setDoc(doc(googleUser(), 'admins/grinch@example.com'), { addedAt: serverTimestamp() }),
    )
    await assertFails(
      setDoc(doc(unverifiedAdmin(), 'admins/elf@example.com'), { addedAt: serverTimestamp() }),
    )
  })
})

describe('bakers and private setup', () => {
  it('are admin only', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'bakers/ann')))
    await assertSucceeds(
      setDoc(doc(admin(), 'bakers/bob'), { name: 'Bob', createdAt: serverTimestamp() }),
    )
    await assertSucceeds(getDoc(doc(admin(), 'events/voting-event/private/setup')))
    for (const db of [googleUser(), voter(), anonymous(), unverifiedAdmin()]) {
      await assertFails(getDoc(doc(db, 'bakers/ann')))
      await assertFails(setDoc(doc(db, 'bakers/bob'), { name: 'Bob' }))
      await assertFails(getDoc(doc(db, 'events/voting-event/private/setup')))
      await assertFails(setDoc(doc(db, 'events/voting-event/private/setup'), { bakerIds: [] }))
    }
  })
})

describe('events and categories', () => {
  it('are publicly readable', async () => {
    await assertSucceeds(getDoc(doc(anonymous(), 'events/setup-event')))
    await assertSucceeds(getDoc(doc(anonymous(), 'events/setup-event/categories/choc')))
  })

  it('are writable only by admins', async () => {
    const event = {
      name: 'New',
      status: 'setup',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await assertSucceeds(setDoc(doc(admin(), 'events/new'), event))
    await assertFails(setDoc(doc(voter(), 'events/new2'), event))
    await assertFails(updateDoc(doc(googleUser(), 'events/voting-event'), { status: 'results' }))
    await assertFails(setDoc(doc(voter(), 'events/voting-event/categories/x'), { name: 'X' }))
    await assertSucceeds(setDoc(doc(admin(), 'events/voting-event/categories/x'), { name: 'X' }))
  })

  it('accepts any status change from an admin, backwards included', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'events/results-event'), { status: 'setup' }))
    await assertFails(updateDoc(doc(admin(), 'events/results-event'), { status: 'finished' }))
  })
})

describe('ballots', () => {
  it('can be created once by their owner while voting', async () => {
    const db = voter()
    await assertSucceeds(setDoc(doc(db, 'events/voting-event/ballots/voter-1'), ballot))
    await assertFails(setDoc(doc(db, 'events/voting-event/ballots/voter-1'), ballot))
    await assertFails(updateDoc(doc(db, 'events/voting-event/ballots/voter-1'), { rankings: {} }))
    await assertFails(deleteDoc(doc(db, 'events/voting-event/ballots/voter-1')))
  })

  it('are still accepted once results are open', async () => {
    await assertSucceeds(setDoc(doc(voter(), 'events/results-event/ballots/voter-1'), ballot))
  })

  it('are rejected before voting opens', async () => {
    await assertFails(setDoc(doc(voter(), 'events/setup-event/ballots/voter-1'), ballot))
  })

  it("can't be cast for someone else or by the signed-out", async () => {
    await assertFails(setDoc(doc(voter('voter-2'), 'events/voting-event/ballots/voter-1'), ballot))
    await assertFails(setDoc(doc(anonymous(), 'events/voting-event/ballots/voter-1'), ballot))
  })

  it('must have exactly rankings and a server submittedAt', async () => {
    const path = 'events/voting-event/ballots/voter-1'
    await assertFails(setDoc(doc(voter(), path), { ...ballot, extra: true }))
    await assertFails(setDoc(doc(voter(), path), { ...ballot, submittedAt: Timestamp.now() }))
    await assertFails(setDoc(doc(voter(), path), { ...ballot, rankings: ['c1'] }))
    await assertFails(setDoc(doc(voter(), path), { rankings: ballot.rankings }))
  })

  it('are readable by their owner and admins only', async () => {
    await assertSucceeds(setDoc(doc(voter(), 'events/voting-event/ballots/voter-1'), ballot))
    await assertSucceeds(getDoc(doc(voter(), 'events/voting-event/ballots/voter-1')))
    await assertSucceeds(getDoc(doc(admin(), 'events/voting-event/ballots/voter-1')))
    await assertFails(getDoc(doc(voter('voter-2'), 'events/voting-event/ballots/voter-1')))
    await assertFails(getDoc(doc(anonymous(), 'events/voting-event/ballots/voter-1')))
  })
})

describe('results', () => {
  it('are hidden from voters until the event shows results', async () => {
    await assertFails(getDoc(doc(voter(), 'events/setup-event/results/live')))
    await assertFails(getDoc(doc(voter(), 'events/voting-event/results/live')))
    await assertSucceeds(getDoc(doc(anonymous(), 'events/results-event/results/live')))
  })

  it('are always readable by admins', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'events/voting-event/results/live')))
  })

  it('are never written by clients', async () => {
    await assertFails(setDoc(doc(admin(), 'events/voting-event/results/live'), { ballotCount: 99 }))
    await assertFails(
      setDoc(doc(voter(), 'events/results-event/results/live'), { ballotCount: 99 }),
    )
  })
})
