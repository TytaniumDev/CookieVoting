import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const ADMIN_EMAIL = 'santa@example.com'
const PHOTO = 'events/e1/plates/photo.jpg'
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
let env: RulesTestEnvironment

beforeAll(async () => {
  // Storage rules check admins/ in Firestore, so both emulators need the project's rules.
  env = await initializeTestEnvironment({
    projectId: 'demo-cookie-voting',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
    storage: { rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8') },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearStorage()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `admins/${ADMIN_EMAIL}`), { addedAt: Timestamp.now() })
    await uploadBytes(ref(ctx.storage(), PHOTO), jpeg, { contentType: 'image/jpeg' })
  })
})

const admin = () =>
  env.authenticatedContext('admin-uid', { email: ADMIN_EMAIL, email_verified: true }).storage()
const voter = () => env.authenticatedContext('voter-1').storage()

describe('plate photos', () => {
  it('are publicly readable', async () => {
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), PHOTO)))
  })

  it('can be uploaded and deleted by admins', async () => {
    const photo = ref(admin(), 'events/e1/plates/new.jpg')
    await assertSucceeds(uploadBytes(photo, jpeg, { contentType: 'image/jpeg' }))
    await assertSucceeds(deleteObject(photo))
  })

  it("can't be uploaded or deleted by voters", async () => {
    await assertFails(
      uploadBytes(ref(voter(), 'events/e1/plates/new.jpg'), jpeg, { contentType: 'image/jpeg' }),
    )
    await assertFails(deleteObject(ref(voter(), PHOTO)))
  })

  it('must be images under 10 MB', async () => {
    await assertFails(
      uploadBytes(ref(admin(), 'events/e1/plates/notes.txt'), jpeg, { contentType: 'text/plain' }),
    )
    const tooBig = new Uint8Array(10 * 1024 * 1024)
    await assertFails(
      uploadBytes(ref(admin(), 'events/e1/plates/big.jpg'), tooBig, { contentType: 'image/jpeg' }),
    )
  })

  it('only live under events/{eventId}/plates', async () => {
    await assertFails(
      uploadBytes(ref(admin(), 'elsewhere/photo.jpg'), jpeg, { contentType: 'image/jpeg' }),
    )
  })
})
