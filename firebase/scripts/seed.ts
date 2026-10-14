/**
 * Seeds the local emulators with demo data: an admin, a baker roster, and three events
 * (one per status) whose categories use the plate photos in fixtures/plates.
 *
 *   npm run emulators   # in one terminal
 *   npm run seed        # in another
 *
 * Only ever talks to the emulators: it refuses to run against anything but a demo- project.
 */
import { paths, type CategoryDoc, type EventStatus } from '@cookie-voting/shared'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { getStorage, type Storage } from 'firebase-admin/storage'
import { readFile } from 'node:fs/promises'
import { jpegSize } from './jpegSize.ts'
import { plateBoxes } from './plates.ts'

export const PROJECT_ID = 'demo-cookie-voting'
export const BUCKET = `${PROJECT_ID}.appspot.com`
export const SEED_ADMIN_EMAIL = 'admin@example.com'
/** A second admin, for tests where two people set up one event together. */
export const SEED_CO_ADMIN_EMAIL = 'elf@example.com'

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199'
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'

const BAKERS = ['Ann', 'Bob', 'Carmen', 'Dev', 'Elif', 'Frank', 'Grace', 'Hiro']

interface SeedCategory {
  name: string
  /** File in fixtures/plates; the `.json` beside it holds its cookie boxes. */
  photo: string | null
}

interface SeedEvent {
  id: string
  name: string
  status: EventStatus
  categories: SeedCategory[]
  ballotCount: number
}

const EVENTS: SeedEvent[] = [
  {
    id: 'bake-off-2025',
    name: 'Christmas Cookie Bake-Off 2025',
    status: 'voting',
    ballotCount: 12,
    categories: [
      { name: 'Gingerbread People', photo: '4-cookies_people.jpg' },
      { name: 'Stars', photo: '4-cookies_stars.jpg' },
      { name: 'Candy Canes', photo: '5-cookies_candy-canes.jpg' },
      { name: 'Stockings', photo: '5-cookies_stockings.jpg' },
      { name: 'Trees', photo: '6-cookies_trees.jpg' },
      { name: 'Cats', photo: '7-cookies_cats.jpg' },
    ],
  },
  {
    id: 'bake-off-2024',
    name: 'Christmas Cookie Bake-Off 2024',
    status: 'results',
    ballotCount: 20,
    categories: [
      { name: 'Gingerbread', photo: '6-cookies_gingerbread-grey-mat.jpg' },
      { name: 'Mixed Shapes', photo: '9-cookies_mixed-green-mat.jpg' },
    ],
  },
  {
    id: 'holiday-party-2026',
    name: 'Holiday Party 2026',
    status: 'setup',
    ballotCount: 0,
    categories: [
      { name: 'Sugar Cookies', photo: null },
      { name: 'Chocolate', photo: null },
    ],
  },
]

/** Deterministic pseudo-random numbers, so every seed produces the same data. */
function random(initial: number): () => number {
  let state = initial
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

async function uploadPhoto(storage: Storage, eventId: string, fileName: string) {
  const bytes = await readFile(new URL(`../../fixtures/plates/${fileName}`, import.meta.url))
  const path = paths.platePhoto(eventId, fileName)
  await storage
    .bucket(BUCKET)
    .file(path)
    .save(bytes, {
      contentType: 'image/jpeg',
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    })
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  const url = `http://${host}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`
  return { path, url, ...jpegSize(bytes) }
}

async function seedEvent(db: Firestore, storage: Storage, event: SeedEvent, bakerIds: string[]) {
  const now = Timestamp.now()
  const next = random(event.id.length * 7919)
  const assignments: Record<string, Record<string, string>> = {}
  const categoryCookies: Record<string, string[]> = {}

  await db.doc(paths.event(event.id)).set({
    name: event.name,
    status: event.status,
    createdAt: now,
    updatedAt: now,
  })

  for (const [order, category] of event.categories.entries()) {
    const categoryId = `cat-${order + 1}`
    const boxes = category.photo ? await plateBoxes(category.photo) : []
    const cookies = boxes.map((box, i) => ({ id: `${categoryId}-cookie-${i + 1}`, box }))
    const doc: CategoryDoc = {
      name: category.name,
      order,
      photo: category.photo ? await uploadPhoto(storage, event.id, category.photo) : null,
      cookies,
    }
    await db.doc(paths.category(event.id, categoryId)).set(doc)
    categoryCookies[categoryId] = cookies.map((c) => c.id)
    assignments[categoryId] = Object.fromEntries(
      cookies.map((c) => [c.id, bakerIds[Math.floor(next() * bakerIds.length)]!]),
    )
  }

  await db.doc(paths.setup(event.id)).set({ bakerIds, assignments })

  for (let v = 0; v < event.ballotCount; v++) {
    const rankings = Object.fromEntries(
      Object.entries(categoryCookies).map(([categoryId, cookieIds]) => [
        categoryId,
        [...cookieIds].sort(() => next() - 0.5).slice(0, 3),
      ]),
    )
    await db.doc(paths.ballot(event.id, `seed-voter-${v + 1}`)).set({ rankings, submittedAt: now })
  }
}

export async function seed(): Promise<void> {
  const app = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET }, 'seed')
  if (!app.options.projectId?.startsWith('demo-'))
    throw new Error('Refusing to seed a real project')
  const db = getFirestore(app)

  for (const email of [SEED_ADMIN_EMAIL, SEED_CO_ADMIN_EMAIL])
    await db.doc(paths.admin(email)).set({ addedAt: Timestamp.now() })
  const bakerIds = BAKERS.map((name) => name.toLowerCase())
  await Promise.all(
    BAKERS.map((name, i) =>
      db.doc(paths.baker(bakerIds[i]!)).set({ name, createdAt: Timestamp.now() }),
    ),
  )
  const storage = getStorage(app)
  for (const event of EVENTS) await seedEvent(db, storage, event, bakerIds)
}

if (import.meta.main) {
  await seed()
  console.log(`Seeded ${EVENTS.length} events. Admin sign-in: ${SEED_ADMIN_EMAIL}`)
}
