import { Alert } from '../Alert/Alert.tsx'
import { Button } from '../Button/Button.tsx'
import { Card } from '../Card/Card.tsx'

export interface SignInPanelProps {
  /** Signed in, but not on the admin list. */
  notAdminEmail?: string | null
  /** Whether that account has already asked to become an admin. */
  requested?: boolean
  error?: string | null
  busy?: boolean
  onSignIn: () => void
  onSignOut: () => void
  onRequestAccess?: () => void
}

/** Shown on admin pages to anyone who isn't a signed-in admin. */
export function SignInPanel({
  notAdminEmail = null,
  requested = false,
  error = null,
  busy = false,
  onSignIn,
  onSignOut,
  onRequestAccess,
}: SignInPanelProps) {
  return (
    <Card tone="festive" className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl">Organisers only 🎅</h1>
      {notAdminEmail ? (
        <>
          {requested ? (
            <Alert tone="success" title="Request sent">
              An organiser will see it on their Admins page. This page lets you in as soon as they
              approve <strong>{notAdminEmail}</strong>.
            </Alert>
          ) : (
            <>
              <Alert tone="warning" title="Not on the admin list">
                You're signed in as <strong>{notAdminEmail}</strong>, which isn't an admin. Ask to
                become one, or switch accounts.
              </Alert>
              {onRequestAccess && (
                <Button fullWidth loading={busy} onClick={onRequestAccess}>
                  Ask to be an admin
                </Button>
              )}
            </>
          )}
          <Button variant="secondary" fullWidth disabled={busy} onClick={onSignOut}>
            Sign out
          </Button>
        </>
      ) : (
        <>
          <p className="text-ink-muted">
            Sign in with Google to set up events. Voting? Use the link your organiser shared.
          </p>
          <Button size="lg" fullWidth loading={busy} onClick={onSignIn}>
            Sign in with Google
          </Button>
        </>
      )}
      {error && (
        <Alert tone="danger" title="Sign-in didn't work">
          {error}
        </Alert>
      )}
    </Card>
  )
}
