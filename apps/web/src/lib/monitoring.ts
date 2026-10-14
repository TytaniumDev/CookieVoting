import { captureException, init } from '@sentry/react'
import { reactRouterBrowserTracingIntegration } from '@sentry/react/react-router'

const dsn = import.meta.env.VITE_SENTRY_DSN

/**
 * Starts Sentry error reporting. Only deploy builds get a DSN, so local dev, tests and
 * emulator builds report nothing. Every Sentry call is a no-op until this runs.
 */
export function initMonitoring() {
  if (!dsn) return
  init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'production',
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [reactRouterBrowserTracingIntegration()],
    // A few page loads and navigations are enough to spot slow screens on the free plan.
    tracesSampleRate: 0.1,
    // Voters are anonymous; don't attach user details or cookies.
    dataCollection: { userInfo: false, cookies: false },
  })
}

/** Reports an error the UI already showed to the user (a failed save, upload, …). */
export function reportError(error: unknown, action: string) {
  captureException(error, { tags: { action } })
}

export { reactErrorHandler, wrapCreateBrowserRouter } from '@sentry/react'
