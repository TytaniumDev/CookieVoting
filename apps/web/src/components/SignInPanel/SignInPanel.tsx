import { Alert } from '../Alert/Alert.tsx'
import { Button } from '../Button/Button.tsx'
import { Card } from '../Card/Card.tsx'

export interface SignInPanelProps {
  /** Signed in, but not on the admin list. */
  notAdminEmail?: string | null
  error?: string | null
  busy?: boolean
  onSignIn: () => void
  onSignOut: () => void
}

/** Shown on admin pages to anyone who isn't a signed-in admin. */
export function SignInPanel({
  notAdminEmail = null,
  error = null,
  busy = false,
  onSignIn,
  onSignOut,
}: SignInPanelProps) {
  return (
    <Card tone="festive" className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl">Organisers only 🎅</h1>
      {notAdminEmail ? (
        <>
          <Alert tone="warning" title="Not on the admin list">
            You're signed in as <strong>{notAdminEmail}</strong>, which isn't an admin. Ask an
            organiser to add you, or switch accounts.
          </Alert>
          <Button variant="secondary" fullWidth loading={busy} onClick={onSignOut}>
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
