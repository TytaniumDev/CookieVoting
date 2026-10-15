import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { Button } from '../components/Button/Button.tsx'
import { Card } from '../components/Card/Card.tsx'
import { reportError } from '../lib/monitoring.ts'
import { isChunkLoadError } from '../lib/staleChunk.ts'

/** Shown when a page fails to load or render, in place of the router's developer error screen. */
export function RouteErrorPage() {
  const error = useRouteError()
  useEffect(() => {
    console.error(error)
    reportError(error, 'Page failed')
  }, [error])

  return (
    <Card className="mx-auto max-w-readable space-y-3 text-center">
      <p className="text-5xl" aria-hidden="true">
        🍪
      </p>
      <h1 className="text-3xl">Oh, crumbs!</h1>
      <p className="text-ink-muted">
        {isChunkLoadError(error)
          ? "This page didn't load. Check your connection, then try again."
          : 'Something went wrong showing this page. Reloading usually fixes it.'}
      </p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </Card>
  )
}
