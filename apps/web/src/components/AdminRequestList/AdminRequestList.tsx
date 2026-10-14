import { Button } from '../Button/Button.tsx'

export interface AdminRequestItem {
  /** Lowercase email. */
  email: string
  /** Their Google display name, when known. */
  name?: string
}

export interface AdminRequestListProps {
  requests: readonly AdminRequestItem[]
  onApprove: (email: string) => void
  onDecline: (email: string) => void
  /** Emails with an approve or decline still saving. */
  pendingEmails?: ReadonlySet<string>
}

/** People who signed in with Google and asked to become admins. */
export function AdminRequestList({
  requests,
  onApprove,
  onDecline,
  pendingEmails = new Set(),
}: AdminRequestListProps) {
  return (
    <section aria-labelledby="requests-heading" className="space-y-3">
      <h2 id="requests-heading" className="text-2xl">
        Asking to join <span className="text-ink-muted">({requests.length})</span>
      </h2>
      <ul className="divide-y divide-border rounded-card border-2 border-accent bg-surface">
        {requests.map((request) => {
          const pending = pendingEmails.has(request.email)
          return (
            <li key={request.email} className="flex flex-wrap items-center gap-2 py-2 pr-2 pl-4">
              <span className="min-w-0 flex-1 py-1">
                <span className="block truncate font-bold">{request.name ?? request.email}</span>
                {request.name && (
                  <span className="block truncate text-sm text-ink-muted">{request.email}</span>
                )}
              </span>
              <span className="flex gap-2">
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => onDecline(request.email)}
                  aria-label={`Decline ${request.email}`}
                >
                  Decline
                </Button>
                <Button
                  loading={pending}
                  onClick={() => onApprove(request.email)}
                  aria-label={`Approve ${request.email}`}
                >
                  Approve
                </Button>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
