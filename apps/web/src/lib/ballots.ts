import { paths, type BallotRankings, type CategoryRanking } from '@cookie-voting/shared'
import { doc, FieldPath, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase.ts'

/**
 * Submits the voter's ballot. Rules allow one create per user, so a second submit
 * (another tab, a double tap) fails with `permission-denied`.
 */
export async function submitBallot(
  eventId: string,
  uid: string,
  rankings: BallotRankings,
): Promise<void> {
  await setDoc(doc(db, paths.ballot(eventId, uid)), {
    rankings,
    submittedAt: serverTimestamp(),
  })
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
