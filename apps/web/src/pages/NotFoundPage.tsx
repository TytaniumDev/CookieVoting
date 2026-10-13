import { Link } from 'react-router'
import { buttonClasses } from '../components/Button/buttonClasses.ts'
import { Card } from '../components/Card/Card.tsx'

export function NotFoundPage() {
  return (
    <Card className="space-y-3 text-center">
      <p className="text-5xl" aria-hidden="true">
        🍪
      </p>
      <h1 className="text-3xl">Crumbs!</h1>
      <p className="text-ink-muted">
        We couldn't find that page. If someone sent you a voting link, check it was copied in full.
      </p>
      <Link to="/" className={buttonClasses({ variant: 'secondary' })}>
        Go home
      </Link>
    </Card>
  )
}
