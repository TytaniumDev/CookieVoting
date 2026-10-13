import {
  paths,
  type BakerDoc,
  type BallotDoc,
  type CategoryDoc,
  type EventDoc,
  type ResultsDoc,
  type SetupDoc,
} from '@cookie-voting/shared'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentReference,
  type FirestoreDataConverter,
  type Query,
  type Timestamp,
  type WithFieldValue,
} from 'firebase/firestore'
import { db } from './firebase.ts'
import { useSubscription, type Subscribe, type Subscription } from './useSubscription.ts'

/** A document's data plus its id. */
export type WithId<T> = T & { id: string }

export type Event = WithId<EventDoc<Timestamp>>
export type Category = WithId<CategoryDoc>
export type Baker = WithId<BakerDoc<Timestamp>>
export type Setup = SetupDoc
export type Ballot = BallotDoc<Timestamp>
export type Results = ResultsDoc<Timestamp>

/**
 * Types documents as the shapes in docs/ARCHITECTURE.md. Rules and Cloud Functions keep
 * the data in that shape, so reads are trusted rather than validated field by field.
 */
function converter<T extends object>(): FirestoreDataConverter<WithId<T>, T> {
  return {
    toFirestore: (data) => {
      const { id: _id, ...rest } = data as Record<string, unknown>
      return rest as WithFieldValue<T>
    },
    fromFirestore: (snapshot) => ({ ...(snapshot.data() as T), id: snapshot.id }),
  }
}

export const refs = {
  events: () => collection(db, paths.events).withConverter(converter<EventDoc<Timestamp>>()),
  event: (eventId: string) =>
    doc(db, paths.event(eventId)).withConverter(converter<EventDoc<Timestamp>>()),
  categories: (eventId: string) =>
    collection(db, paths.categories(eventId)).withConverter(converter<CategoryDoc>()),
  bakers: () => collection(db, paths.bakers).withConverter(converter<BakerDoc<Timestamp>>()),
  setup: (eventId: string) => doc(db, paths.setup(eventId)),
  ballot: (eventId: string, uid: string) => doc(db, paths.ballot(eventId, uid)),
  results: (eventId: string) => doc(db, paths.results(eventId)),
}

/** Listens to one document; `null` when it doesn't exist. */
function watchDoc<T>(ref: DocumentReference<T>): Subscribe<T | null> {
  return (onData, onError) =>
    onSnapshot(ref, (snapshot) => onData(snapshot.exists() ? snapshot.data() : null), onError)
}

function watchQuery<T>(q: Query<T>): Subscribe<T[]> {
  return (onData, onError) =>
    onSnapshot(q, (snapshot) => onData(snapshot.docs.map((d) => d.data())), onError)
}

/** All events, newest first (admin dashboard). */
export function useEvents(): Subscription<Event[]> {
  return useSubscription(watchQuery(query(refs.events(), orderBy('createdAt', 'desc'))), 'events')
}

export function useEvent(eventId: string): Subscription<Event | null> {
  return useSubscription(watchDoc(refs.event(eventId)), `event/${eventId}`)
}

/** An event's categories in display order. */
export function useCategories(eventId: string): Subscription<Category[]> {
  return useSubscription(
    watchQuery(query(refs.categories(eventId), orderBy('order'))),
    `categories/${eventId}`,
  )
}

/** The global baker roster, by name (admin only). */
export function useBakers(): Subscription<Baker[]> {
  return useSubscription(watchQuery(query(refs.bakers(), orderBy('name'))), 'bakers')
}

/** The event roster and baker assignments (admin only). */
export function useSetup(eventId: string): Subscription<Setup | null> {
  return useSubscription(
    watchDoc(refs.setup(eventId) as DocumentReference<Setup>),
    `setup/${eventId}`,
  )
}

/** The signed-in voter's ballot, if they've voted. Pass `null` until signed in. */
export function useBallot(eventId: string, uid: string | null): Subscription<Ballot | null> {
  return useSubscription(
    uid === null ? null : watchDoc(refs.ballot(eventId, uid) as DocumentReference<Ballot>),
    `ballot/${eventId}/${uid}`,
  )
}

/** Live results. Readable by admins always, and by everyone once results are open. */
export function useResults(eventId: string): Subscription<Results | null> {
  return useSubscription(
    watchDoc(refs.results(eventId) as DocumentReference<Results>),
    `results/${eventId}`,
  )
}
