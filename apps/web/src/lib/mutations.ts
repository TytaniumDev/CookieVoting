import {
  paths,
  removeBakerFromSetup,
  type BakerDoc,
  type EventDoc,
  type SetupDoc,
} from '@cookie-voting/shared'
import {
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import { db } from './firebase.ts'

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
