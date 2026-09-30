import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="space-y-3 text-center">
      <h1 className="text-3xl">Crumbs! 🍪</h1>
      <p className="text-ink-muted">We couldn't find that page.</p>
      <Link to="/" className="text-primary underline">
        Go home
      </Link>
    </section>
  )
}
