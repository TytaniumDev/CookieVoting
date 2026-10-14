import type { SetupProgress } from '@cookie-voting/shared'
import { Link } from 'react-router'
import { Button } from '../../../components/Button/Button.tsx'
import { Card } from '../../../components/Card/Card.tsx'
import { SharePanel } from '../../../components/SharePanel/SharePanel.tsx'
import { useResults, type Event } from '../../../lib/data.ts'
import { voterUrl } from '../../../lib/links.ts'
import { useStatusChange } from '../useStatusChange.tsx'

/** Before voting: what's left to do. While voting: the link, the count and controls. */
export function VotingStep({ event, progress }: { event: Event; progress: SetupProgress }) {
  const results = useResults(event.id)
  const status = useStatusChange(event.id, event.status)
  const ballotCount = results.status === 'ready' ? (results.data?.ballotCount ?? 0) : null

  if (event.status === 'setup') {
    const checks = [
      { id: 'bakers', done: progress.done.bakers, label: 'Add the bakers', step: 'bakers' },
      {
        id: 'categories',
        done: progress.done.categories,
        label: 'Photograph every plate',
        step: 'categories',
      },
      {
        id: 'boxed',
        done: progress.boxed,
        label: 'Box the cookies on every plate',
        step: 'cookies',
      },
      {
        id: 'tagged',
        done: progress.done.cookies,
        label:
          progress.unassignedCookies > 0 && progress.boxed
            ? `Tag every cookie with its baker (${progress.unassignedCookies} left)`
            : 'Tag every cookie with its baker',
        step: 'cookies',
      },
    ]
    return (
      <Card className="space-y-4">
        <h2 className="text-2xl">Open voting</h2>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full text-sm ${
                  check.done ? 'bg-success text-on-success' : 'bg-surface-muted text-ink'
                }`}
              >
                {check.done ? '✓' : ''}
              </span>
              {check.done ? (
                <span>
                  {check.label} <span className="sr-only">(done)</span>
                </span>
              ) : (
                <Link to={`?step=${check.step}`} className="font-bold text-primary underline">
                  {check.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          fullWidth
          disabled={!progress.readyToVote}
          loading={status.busy}
          onClick={() => status.change('voting')}
        >
          Open voting
        </Button>
        {status.dialog}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card tone="festive" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">Voting is open</h2>
          <p className="text-ink-muted" aria-live="polite">
            <span className="font-display text-3xl font-semibold text-ink">
              {ballotCount ?? '…'}
            </span>{' '}
            {ballotCount === 1 ? 'ballot' : 'ballots'} so far
          </p>
        </div>
        <SharePanel url={voterUrl(event.id)} title={event.name} />
      </Card>
      <div className="flex flex-wrap gap-2">
        {event.status === 'voting' && (
          <Button onClick={() => status.change('results')} loading={status.busy}>
            Open results
          </Button>
        )}
        <Button variant="ghost" onClick={() => status.change('setup')}>
          Close voting
        </Button>
      </div>
      {status.dialog}
    </div>
  )
}
