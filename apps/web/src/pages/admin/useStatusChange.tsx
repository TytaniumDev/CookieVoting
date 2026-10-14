import type { EventStatus } from '@cookie-voting/shared'
import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx'
import { useShowError } from '../../lib/errors.ts'
import { setEventStatus } from '../../lib/mutations.ts'

interface Confirmation {
  title: string
  body: string
  confirmLabel: string
}

/** What to ask before each move; opening voting is gated by the checklist instead. */
function confirmationFor(from: EventStatus, to: EventStatus): Confirmation | null {
  if (to === 'results') {
    return {
      title: 'Open results?',
      body: 'Everyone with the link sees the winners straight away. Voting stays open.',
      confirmLabel: 'Open results',
    }
  }
  if (to === 'setup') {
    return {
      title: 'Close voting?',
      body: 'Nobody can vote until you open it again. Ballots already in are kept, and you can edit the event meanwhile.',
      confirmLabel: 'Close voting',
    }
  }
  if (from === 'results') {
    return {
      title: 'Hide results?',
      body: 'Voters go back to the voting screens until you open results again.',
      confirmLabel: 'Hide results',
    }
  }
  return null
}

const failureTitle: Record<EventStatus, string> = {
  setup: "Voting didn't close",
  voting: "Voting didn't open",
  results: "Results didn't open",
}

/**
 * Changes the event's status (owner decision Q2: any status, any order), asking first
 * where voters would notice. Render `dialog` once; call `change` from buttons.
 */
export function useStatusChange(eventId: string, current: EventStatus) {
  const [pending, setPending] = useState<EventStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const showError = useShowError()

  async function apply(status: EventStatus) {
    setBusy(true)
    try {
      await setEventStatus(eventId, status)
    } catch (e) {
      showError(failureTitle[status], e)
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  function change(status: EventStatus) {
    if (confirmationFor(current, status)) setPending(status)
    else void apply(status)
  }

  const confirmation = pending && confirmationFor(current, pending)
  const dialog: ReactNode = (
    <ConfirmDialog
      open={confirmation !== null}
      title={confirmation?.title ?? ''}
      confirmLabel={confirmation?.confirmLabel ?? 'OK'}
      busy={busy}
      onCancel={() => setPending(null)}
      onConfirm={() => pending && void apply(pending)}
    >
      <p>{confirmation?.body}</p>
    </ConfirmDialog>
  )

  return { change, busy, dialog }
}
