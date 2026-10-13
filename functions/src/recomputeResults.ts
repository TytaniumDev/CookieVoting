import {
  paths,
  tallyResults,
  type BakerDoc,
  type BallotDoc,
  type CategoryDoc,
  type ResultsDoc,
  type SetupDoc,
} from '@cookie-voting/shared'
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { buildTallyInput } from './tallyInput.ts'

type StoredResults = ResultsDoc<Timestamp>

export type RecomputeOutcome = 'written' | 'skipped-stale'

/**
 * Recomputes `events/{eventId}/results/live` from scratch.
 *
 * Every input is read in one read-only transaction, so the tally sees a consistent
 * snapshot without locking voters' ballots. Recomputes can run concurrently (one per
 * trigger), so the write only lands if no result computed from a newer snapshot is
 * already stored. Each trigger fires after its change commits, so the recompute that
 * started last sees every change and wins.
 */
export async function recomputeResults(db: Firestore, eventId: string): Promise<RecomputeOutcome> {
  const { input, readTime } = await db.runTransaction(
    async (tx) => {
      const [categoriesSnap, setupSnap, ballotsSnap] = await Promise.all([
        tx.get(db.collection(paths.categories(eventId))),
        tx.get(db.doc(paths.setup(eventId))),
        tx.get(db.collection(paths.ballots(eventId))),
      ])
      const setup = setupSnap.data() as SetupDoc | undefined
      const bakerRefs = (setup?.bakerIds ?? []).map((id) => db.doc(paths.baker(id)))
      const bakerSnaps = bakerRefs.length > 0 ? await tx.getAll(...bakerRefs) : []

      const bakerNames = new Map<string, string>()
      for (const snap of bakerSnaps) {
        const baker = snap.data() as BakerDoc<Timestamp> | undefined
        if (baker) bakerNames.set(snap.id, baker.name)
      }

      return {
        readTime: ballotsSnap.readTime,
        input: buildTallyInput({
          categories: categoriesSnap.docs.map((doc) => ({
            id: doc.id,
            data: doc.data() as CategoryDoc,
          })),
          setup,
          bakerNames,
          ballots: ballotsSnap.docs.map((doc) => (doc.data() as BallotDoc<Timestamp>).rankings),
        }),
      }
    },
    { readOnly: true },
  )

  const results = tallyResults(input)
  const resultsRef = db.doc(paths.results(eventId))

  return db.runTransaction(async (tx) => {
    const existing = (await tx.get(resultsRef)).data() as StoredResults | undefined
    // Timestamp.valueOf() is a lexicographically sortable string with nanosecond precision.
    if (existing && existing.sourceReadTime.valueOf() > readTime.valueOf()) {
      return 'skipped-stale'
    }
    tx.set(resultsRef, {
      ...results,
      sourceReadTime: readTime,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return 'written'
  })
}
