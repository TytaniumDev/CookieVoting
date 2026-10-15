import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { AdminList } from '../../components/AdminList/AdminList.tsx'
import { AdminRequestList } from '../../components/AdminRequestList/AdminRequestList.tsx'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useAuthUser } from '../../lib/auth.ts'
import { useAdminRequests, useAdmins } from '../../lib/data.ts'
import { useShowError } from '../../lib/errors.ts'
import { addAdmin, declineAdminRequest, removeAdmin } from '../../lib/mutations.ts'

/**
 * Who can set up events. People ask from the sign-in screen and any admin approves or
 * declines them here; admins can also add someone by Google email, or remove them.
 */
export function AdminsPage() {
  const user = useAuthUser()
  const admins = useAdmins()
  const requests = useAdminRequests()
  const showError = useShowError()
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const [removing, setRemoving] = useState<string | null>(null)
  const currentEmail =
    user.status === 'ready' && user.data?.email ? user.data.email.toLowerCase() : ''

  async function run(email: string, failure: string, action: () => Promise<void>) {
    setPending((p) => new Set(p).add(email))
    try {
      await action()
    } catch (e) {
      showError(failure, e)
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(email)
        return next
      })
    }
  }

  const add = (email: string) =>
    void run(email, `${email} wasn't added`, () => addAdmin(email, currentEmail))

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link to="/" className="text-sm font-bold text-primary">
          ← All events
        </Link>
        <h1 className="text-3xl">Admins</h1>
        <p className="text-ink-muted">
          Admins can set up and run every event. To let someone in, send them this site's link:
          after signing in with Google they can ask to join, and their request shows up here.
        </p>
      </div>

      {requests.status === 'ready' && requests.data.length > 0 && (
        <AdminRequestList
          requests={requests.data.map((r) => ({ email: r.id, name: r.name }))}
          pendingEmails={pending}
          onApprove={add}
          onDecline={(email) =>
            void run(email, `${email} wasn't declined`, () => declineAdminRequest(email))
          }
        />
      )}

      {admins.status === 'loading' && <Spinner layout="section" label="Loading admins" />}
      {admins.status === 'error' && (
        <Alert tone="danger" title="Couldn't load the admin list">
          {admins.error.message}
        </Alert>
      )}
      {admins.status === 'ready' && (
        <AdminList
          admins={admins.data.map((a) => ({ email: a.id, addedBy: a.addedBy }))}
          currentEmail={currentEmail}
          pendingEmails={pending}
          onAdd={add}
          onRemove={setRemoving}
        />
      )}

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing ?? 'admin'}?`}
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return
          const email = removing
          setRemoving(null)
          void run(email, `${email} wasn't removed`, () => removeAdmin(email))
        }}
      >
        They won't be able to set up or run events any more. You can add them back later.
      </ConfirmDialog>
    </section>
  )
}
