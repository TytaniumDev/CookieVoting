import { Link } from 'react-router'
import { Alert } from '../../../components/Alert/Alert.tsx'
import { Button } from '../../../components/Button/Button.tsx'
import { buttonClasses } from '../../../components/Button/buttonClasses.ts'
import { Card } from '../../../components/Card/Card.tsx'
import type { Event } from '../../../lib/data.ts'
import { useStatusChange } from '../useStatusChange.tsx'

/** Opening (or hiding) the results; voting carries on either way. */
export function ResultsStep({ event }: { event: Event }) {
  const status = useStatusChange(event.id, event.status)

  return (
    <Card className="space-y-4">
      <h2 className="text-2xl">Results</h2>
      {event.status === 'results' ? (
        <>
          <p>Results are open: everyone with the voting link sees them. Voting is still open.</p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/event/${event.id}/results`} className={buttonClasses()}>
              See results
            </Link>
            <Button variant="ghost" onClick={() => status.change('voting')}>
              Hide results
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-ink-muted">
            {event.status === 'voting'
              ? 'When everyone has voted, open the results. Late voters can still vote.'
              : "Voting isn't open yet. Results show the winners from the ballots already in."}
          </p>
          <Button onClick={() => status.change('results')} loading={status.busy}>
            Open results
          </Button>
        </>
      )}
      {status.error && (
        <Alert tone="danger" title="That didn't save">
          {status.error}
        </Alert>
      )}
      {status.dialog}
    </Card>
  )
}
