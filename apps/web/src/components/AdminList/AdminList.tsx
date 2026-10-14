import { normaliseEmail } from '@cookie-voting/shared'
import { useState } from 'react'
import { Badge } from '../Badge/Badge.tsx'
import { Button } from '../Button/Button.tsx'
import { TextField } from '../TextField/TextField.tsx'

export interface AdminListItem {
  /** Lowercase email. */
  email: string
  /** Who added them, when known. */
  addedBy?: string
}

export interface AdminListProps {
  admins: readonly AdminListItem[]
  /** The signed-in admin, who can't remove themselves. */
  currentEmail: string
  /** Called with a valid, lowercased email that isn't on the list yet. */
  onAdd: (email: string) => void
  onRemove: (email: string) => void
  /** Emails with a pending add or remove. */
  pendingEmails?: ReadonlySet<string>
}

/** Everyone who can set up events, and a form to let someone else in by Google email. */
export function AdminList({
  admins,
  currentEmail,
  onAdd,
  onRemove,
  pendingEmails = new Set(),
}: AdminListProps) {
  const [input, setInput] = useState('')
  const [touched, setTouched] = useState(false)
  const email = normaliseEmail(input)
  const already = email !== null && admins.some((a) => a.email === email)
  const error =
    !touched || !input.trim()
      ? undefined
      : email === null
        ? 'Enter an email address, like name@gmail.com.'
        : already
          ? `${email} is already an admin.`
          : undefined

  return (
    <div className="space-y-6">
      <section aria-labelledby="admins-heading" className="space-y-3">
        <h2 id="admins-heading" className="text-2xl">
          Admins <span className="text-ink-muted">({admins.length})</span>
        </h2>
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {admins.map((admin) => (
            <li
              key={admin.email}
              className="flex items-center justify-between gap-2 py-1 pr-1 pl-4"
            >
              <span className="min-w-0 py-2">
                <span className="block truncate font-bold">{admin.email}</span>
                {admin.addedBy && (
                  <span className="block truncate text-sm text-ink-muted">
                    Added by {admin.addedBy}
                  </span>
                )}
              </span>
              {admin.email === currentEmail ? (
                <Badge className="mr-3">You</Badge>
              ) : (
                <Button
                  variant="ghost"
                  loading={pendingEmails.has(admin.email)}
                  onClick={() => onRemove(admin.email)}
                  aria-label={`Remove ${admin.email}`}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="add-admin-heading" className="space-y-3">
        <h2 id="add-admin-heading" className="text-2xl">
          Add an admin
        </h2>
        <form
          className="space-y-3"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setTouched(true)
            if (email === null || already) return
            onAdd(email)
            setInput('')
            setTouched(false)
          }}
        >
          <TextField
            label="Google email"
            hint="They sign in with this Google account and can set up every event."
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={input}
            error={error}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          <Button type="submit" fullWidth loading={email !== null && pendingEmails.has(email)}>
            Add admin
          </Button>
        </form>
      </section>
    </div>
  )
}
