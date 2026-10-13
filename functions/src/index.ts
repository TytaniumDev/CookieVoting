import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
import { logger } from 'firebase-functions'
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore'
import { recomputeResults } from './recomputeResults.ts'

initializeApp()
setGlobalOptions({ region: 'us-west1', maxInstances: 10 })

async function recompute(eventId: string, reason: string): Promise<void> {
  const outcome = await recomputeResults(getFirestore(), eventId)
  logger.info('recomputeResults', { eventId, reason, outcome })
}

/** A voter submitted a ballot. */
export const onBallotCreated = onDocumentCreated('events/{eventId}/ballots/{uid}', (event) =>
  recompute(event.params.eventId, 'ballot'),
)

/** The roster or baker assignments changed. */
export const onSetupWritten = onDocumentWritten('events/{eventId}/private/setup', (event) =>
  recompute(event.params.eventId, 'setup'),
)

/** A category was added, renamed, reordered, deleted, or its cookies changed. */
export const onCategoryWritten = onDocumentWritten(
  'events/{eventId}/categories/{categoryId}',
  (event) => recompute(event.params.eventId, 'category'),
)

/** The event moved between setup, voting and results. */
export const onEventStatusChanged = onDocumentUpdated('events/{eventId}', async (event) => {
  if (event.data?.before.get('status') === event.data?.after.get('status')) return
  await recompute(event.params.eventId, 'status')
})
