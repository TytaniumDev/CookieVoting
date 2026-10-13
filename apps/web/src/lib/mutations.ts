import {
  paths,
  removeBakerFromSetup,
  type BakerDoc,
  type CategoryDoc,
  type Cookie,
  type EventDoc,
  type EventStatus,
  type PlatePhoto,
  type SetupDoc,
} from '@cookie-voting/shared'
import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import { db } from './firebase.ts'
import { deletePlatePhoto } from './storage.ts'

type NewDoc<T> = { [K in keyof T]: T[K] | FieldValue }

/** Creates an event in `setup` with an empty roster; returns its id. */
export async function createEvent(name: string): Promise<string> {
  const eventRef = doc(collection(db, paths.events))
  const event: NewDoc<EventDoc<unknown>> = {
    name: name.trim(),
    status: 'setup',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const setup: SetupDoc = { bakerIds: [], assignments: {} }
  const batch = writeBatch(db)
  batch.set(eventRef, event)
  batch.set(doc(db, paths.setup(eventRef.id)), setup)
  await batch.commit()
  return eventRef.id
}

export async function addBakerToEvent(eventId: string, bakerId: string): Promise<void> {
  await updateDoc(doc(db, paths.setup(eventId)), { bakerIds: arrayUnion(bakerId) })
}

/** Saves a new baker to the global roster and adds them to the event. */
export async function createBakerForEvent(eventId: string, name: string): Promise<string> {
  const bakerRef = doc(collection(db, paths.bakers))
  const baker: NewDoc<BakerDoc<unknown>> = { name: name.trim(), createdAt: serverTimestamp() }
  const batch = writeBatch(db)
  batch.set(bakerRef, baker)
  batch.update(doc(db, paths.setup(eventId)), { bakerIds: arrayUnion(bakerRef.id) })
  await batch.commit()
  return bakerRef.id
}

/** Takes a baker off the event (not the global roster) and unassigns their cookies. */
export async function removeBakerFromEvent(eventId: string, bakerId: string): Promise<void> {
  const setupRef = doc(db, paths.setup(eventId))
  await runTransaction(db, async (tx) => {
    const setup = (await tx.get(setupRef)).data() as SetupDoc | undefined
    if (!setup) return
    tx.set(setupRef, removeBakerFromSetup(setup, bakerId))
  })
}

/** Adds a category at the end of the list; returns its id. */
export async function addCategory(eventId: string, name: string, order: number): Promise<string> {
  const categoryRef = doc(collection(db, paths.categories(eventId)))
  const category: CategoryDoc = { name: name.trim(), order, photo: null, cookies: [] }
  const batch = writeBatch(db)
  batch.set(categoryRef, category)
  batch.update(doc(db, paths.event(eventId)), { updatedAt: serverTimestamp() })
  await batch.commit()
  return categoryRef.id
}

export async function renameCategory(
  eventId: string,
  categoryId: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(db, paths.category(eventId, categoryId)), { name: name.trim() })
}

/** Saves a new display order: each category's `order` becomes its index. */
export async function reorderCategories(eventId: string, categoryIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  categoryIds.forEach((id, order) => batch.update(doc(db, paths.category(eventId, id)), { order }))
  await batch.commit()
}

/**
 * Deletes a category, its baker assignments and its plate photo. Allowed even after
 * votes exist (owner decision Q2); those picks simply stop counting.
 */
export async function deleteCategory(
  eventId: string,
  categoryId: string,
  photo: PlatePhoto | null,
): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, paths.category(eventId, categoryId)))
  batch.update(doc(db, paths.setup(eventId)), { [`assignments.${categoryId}`]: deleteField() })
  await batch.commit()
  if (photo) await deletePlatePhoto(photo)
}

/**
 * Saves a category's cookie boxes (already in reading order). Cookies that were
 * removed also lose their baker assignment.
 */
export async function saveCookies(
  eventId: string,
  categoryId: string,
  cookies: readonly Cookie[],
  removedIds: readonly string[],
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, paths.category(eventId, categoryId)), { cookies })
  if (removedIds.length > 0) {
    batch.update(
      doc(db, paths.setup(eventId)),
      Object.fromEntries(
        removedIds.map((id) => [`assignments.${categoryId}.${id}`, deleteField()]),
      ),
    )
  }
  await batch.commit()
}

/** Assigns a cookie to a baker on the event's roster. */
export async function assignBaker(
  eventId: string,
  categoryId: string,
  cookieId: string,
  bakerId: string,
): Promise<void> {
  await updateDoc(doc(db, paths.setup(eventId)), {
    [`assignments.${categoryId}.${cookieId}`]: bakerId,
  })
}

/**
 * Moves the event to any status (owner decision Q2: no locks). Cloud Functions
 * recompute the results, and voters' screens follow the status live.
 */
export async function setEventStatus(eventId: string, status: EventStatus): Promise<void> {
  await updateDoc(doc(db, paths.event(eventId)), { status, updatedAt: serverTimestamp() })
}
