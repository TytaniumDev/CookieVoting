import {
  paths,
  type AdminDoc,
  type AdminRequestDoc,
  type BakerDoc,
  type BallotDoc,
  type CategoryDoc,
  type EventDoc,
  type ResultsDoc,
  type SetupDoc,
} from '@cookie-voting/shared'
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
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

/** An admin; `id` is their lowercase email. */
export type Admin = WithId<AdminDoc<Timestamp>>
/** Someone asking to be an admin; `id` is their lowercase email. */
export type AdminRequest = WithId<AdminRequestDoc<Timestamp>>
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
    // Pending server timestamps (e.g. a just-created event's createdAt) read as the
    // local estimate instead of null.
    fromFirestore: (snapshot, options) => ({
      ...(snapshot.data({ ...options, serverTimestamps: 'estimate' }) as T),
      id: snapshot.id,
    }),
  }
}

export const refs = {
  admins: () => collection(db, paths.admins).withConverter(converter<AdminDoc<Timestamp>>()),
  adminRequests: () =>
    collection(db, paths.adminRequests).withConverter(converter<AdminRequestDoc<Timestamp>>()),
  adminRequest: (email: string) =>
    doc(db, paths.adminRequest(email)).withConverter(converter<AdminRequestDoc<Timestamp>>()),
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

/**
 * Like `watchDoc`, but a write still on its way to the server counts as not there yet,
 * so the UI only treats it as saved once Firestore has accepted it.
 */
function watchSavedDoc<T>(ref: DocumentReference<T>): Subscribe<T | null> {
  return (onData, onError) =>
    onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot) =>
        onData(snapshot.exists() && !snapshot.metadata.hasPendingWrites ? snapshot.data() : null),
      onError,
    )
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

/** Everyone on the admin list, by email (admin only). */
export function useAdmins(): Subscription<Admin[]> {
  return useSubscription(watchQuery(refs.admins()), 'admins')
}

/** Requests to become an admin, oldest first (admin only). */
export function useAdminRequests(): Subscription<AdminRequest[]> {
  return useSubscription(
    watchQuery(query(refs.adminRequests(), orderBy('requestedAt'))),
    'adminRequests',
  )
}

/** The signed-in Google user's own request to become an admin; pass `null` until known. */
export function useOwnAdminRequest(email: string | null): Subscription<AdminRequest | null> {
  return useSubscription(
    email === null ? null : watchDoc(refs.adminRequest(email)),
    `adminRequest/${email}`,
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

/**
 * The signed-in voter's ballot once the server has it. Pass `null` until signed in. A
 * ballot still being sent reads as `null`, so "Thanks for voting" never shows for a vote
 * that a reload or a closed tab could still lose.
 */
export function useBallot(eventId: string, uid: string | null): Subscription<Ballot | null> {
  return useSubscription(
    uid === null ? null : watchSavedDoc(refs.ballot(eventId, uid) as DocumentReference<Ballot>),
    `ballot/${eventId}/${uid}`,
  )
}

/**
 * Live results. Readable by admins always, and by everyone once results are open: pass
 * `null` until then, since a denied read ends the listener.
 */
export function useResults(eventId: string | null): Subscription<Results | null> {
  return useSubscription(
    eventId === null ? null : watchDoc(refs.results(eventId) as DocumentReference<Results>),
    `results/${eventId}`,
  )
}

/**
 * Every category name ever used, for suggestions (PRD §6.3). Read once rather than
 * listened to: it only feeds autocomplete.
 */
export function usePastCategoryNames(): Subscription<string[]> {
  return useSubscription<string[]>((onData, onError) => {
    let active = true
    getDocs(collectionGroup(db, 'categories'))
      .then((snapshot) => {
        if (active) onData(snapshot.docs.map((d) => String(d.get('name') ?? '')))
      })
      .catch((error: Error) => active && onError(error))
    return () => {
      active = false
    }
  }, 'pastCategoryNames')
}
