import { paths, type BallotRankings, type CategoryRanking } from '@cookie-voting/shared'
import {
  doc,
  FieldPath,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import type { Ballot } from './data.ts'
import { db } from './firebase.ts'

/**
 * Submits the voter's ballot and resolves once the server has it, with the rankings it
 * holds. Rules allow one create per user, so a second submit (another tab, a double tap)
 * is refused; if a ballot is already there, that one counts and its rankings come back.
 * That also covers a retry of a send whose answer got lost on the way back.
 * Fails with `permission-denied` when there's no ballot and voting is closed.
 */
export async function submitBallot(
  eventId: string,
  uid: string,
  rankings: BallotRankings,
): Promise<BallotRankings> {
  const ref = doc(db, paths.ballot(eventId, uid))
  try {
    await setDoc(ref, { rankings, submittedAt: serverTimestamp() })
    return rankings
  } catch (e) {
    if ((e as { code?: string }).code !== 'permission-denied') throw e
    const sent = await getDocFromServer(ref)
    if (!sent.exists()) throw e
    return (sent.data() as Ballot).rankings
  }
}

/**
 * Replaces one category's picks on a ballot already sent. Rules allow it only while the
 * event is `voting`, so it fails with `permission-denied` once results open.
 */
export async function updateBallotCategory(
  eventId: string,
  uid: string,
  categoryId: string,
  ranking: CategoryRanking,
): Promise<void> {
  await updateDoc(
    doc(db, paths.ballot(eventId, uid)),
    new FieldPath('rankings', categoryId),
    ranking,
    'updatedAt',
    serverTimestamp(),
  )
}
