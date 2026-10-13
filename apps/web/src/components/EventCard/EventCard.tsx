import type { EventStatus } from '@cookie-voting/shared'
import { Link } from 'react-router'
import { Badge, type BadgeTone } from '../Badge/Badge.tsx'

export interface EventCardProps {
  name: string
  status: EventStatus
  createdAt: Date
  /** Where the event's setup page lives. */
  to: string
  /** The next setup step to do, e.g. "Categories". Omitted when nothing is left. */
  currentStep?: string | null
}

const statusLabels: Record<EventStatus, { label: string; tone: BadgeTone }> = {
  setup: { label: 'Setting up', tone: 'accent' },
  voting: { label: 'Voting open', tone: 'secondary' },
  results: { label: 'Results open', tone: 'primary' },
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** One event on the admin dashboard; the whole card links to the event. */
export function EventCard({ name, status, createdAt, to, currentStep }: EventCardProps) {
  const { label, tone } = statusLabels[status]
  return (
    <Link
      to={to}
      className="block rounded-card border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-raised"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl">{name}</h2>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Created {dateFormat.format(createdAt)}
        {status === 'setup' && currentStep && <> · Next: {currentStep}</>}
      </p>
    </Link>
  )
}
