import { paths, type BallotRankings } from '@cookie-voting/shared'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase.ts'

/**
 * Submits the voter's ballot. Rules allow one create per user and no updates, so a
 * second submit (another tab, a double tap) fails with `permission-denied`.
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
