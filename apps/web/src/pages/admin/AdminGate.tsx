import { useState } from 'react'
import { Outlet } from 'react-router'
import { Alert } from '../../components/Alert/Alert.tsx'
import { SignInPanel } from '../../components/SignInPanel/SignInPanel.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { signInWithGoogle, signOut, useAuthUser, useIsAdmin } from '../../lib/auth.ts'
import { useOwnAdminRequest } from '../../lib/data.ts'
import { requestAdminAccess } from '../../lib/mutations.ts'

/** Wraps every admin page: only signed-in Google accounts on the admin list get through. */
export function AdminGate() {
  const user = useAuthUser()
  const signedIn = user.status === 'ready' ? user.data : null
  const isAdmin = useIsAdmin(signedIn)
  const googleEmail = signedIn && !signedIn.isAnonymous ? signedIn.email : null
  // Only asked once we know they're not an admin, since admins can't have a request.
  const request = useOwnAdminRequest(
    isAdmin.status === 'ready' && !isAdmin.data ? googleEmail : null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (user.status === 'loading' || (signedIn && isAdmin.status === 'loading')) {
    return <Spinner size="lg" label="Checking who you are" className="mx-auto mt-12" />
  }
  if (user.status === 'error' || isAdmin.status === 'error') {
    return (
      <Alert tone="danger" title="Something went wrong">
        We couldn't check your sign-in. Reload the page to try again.
      </Alert>
    )
  }
  if (signedIn && !signedIn.isAnonymous && isAdmin.status === 'ready' && isAdmin.data) {
    return <Outlet />
  }

  return (
    <SignInPanel
      notAdminEmail={googleEmail}
      requested={request.status === 'ready' && request.data !== null}
      busy={busy || (googleEmail !== null && request.status === 'loading')}
      error={error}
      onSignIn={() => run(signInWithGoogle)}
      onSignOut={() => run(signOut)}
      onRequestAccess={() =>
        googleEmail && run(() => requestAdminAccess(googleEmail, signedIn?.displayName ?? null))
      }
    />
  )
}
