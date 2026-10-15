import {
  addIntegration,
  captureException,
  captureMessage,
  feedbackAsyncIntegration,
  getFeedback,
  init,
  lazyLoadIntegration,
} from '@sentry/react'
import { reactRouterBrowserTracingIntegration } from '@sentry/react/react-router'

const dsn = import.meta.env.VITE_SENTRY_DSN

/** Whether reports reach Sentry: only deploy builds have a DSN. */
export const monitoringEnabled = Boolean(dsn)

/**
 * Starts Sentry error reporting and the feedback form. Only deploy builds get a DSN, so
 * local dev, tests and emulator builds report nothing. Every Sentry call is a no-op until
 * this runs.
 */
export function initMonitoring() {
  if (!dsn) return
  init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'production',
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [reactRouterBrowserTracingIntegration(), feedbackIntegration()],
    // A few page loads and navigations are enough to spot slow screens on the free plan.
    tracesSampleRate: 0.1,
    // Replays are recorded only into a memory buffer and sent with a feedback report.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    // Voters are anonymous; don't attach user details or cookies.
    dataCollection: { userInfo: false, cookies: false },
  })
  void loadReplay()
}

/**
 * The "Send feedback" form. Its own button stays hidden (`FeedbackButton` opens it from
 * the app bar), and the form and screenshot editor only download when it first opens.
 * Sentry offers screenshots on laptops only; phones send the replay instead.
 */
function feedbackIntegration() {
  return feedbackAsyncIntegration({
    autoInject: false,
    showBranding: false,
    // Voters are anonymous: no name or email fields.
    showName: false,
    showEmail: false,
    enableScreenshot: true,
    colorScheme: 'light',
    formTitle: 'Send feedback',
    messageLabel: 'What happened?',
    messagePlaceholder: 'Something broken, confusing or just nice? Tell us here.',
    submitButtonLabel: 'Send',
    addScreenshotButtonLabel: 'Add a screenshot',
    successMessageText: 'Thanks! We got your note.',
    // The app's tokens reach the form's shadow DOM as inherited custom properties.
    themeLight: {
      foreground: 'var(--color-ink)',
      background: 'var(--color-surface)',
      accentForeground: 'var(--color-on-primary)',
      accentBackground: 'var(--color-primary)',
      successColor: 'var(--color-success)',
      errorColor: 'var(--color-danger)',
      outline: '1px auto var(--color-focus)',
    },
  })
}

/**
 * Session replay keeps the last minute of the page in memory so a feedback report shows
 * what the person saw, on phones too. It's ~50 KB, so it downloads from Sentry's CDN after
 * the page has loaded instead of riding in the app bundle. Errors don't send replays
 * (`beforeErrorSampling`), which saves the free plan's replays for feedback.
 */
async function loadReplay() {
  try {
    const replayIntegration = await lazyLoadIntegration('replayIntegration')
    addIntegration(
      replayIntegration({
        // Nothing on screen is private (cookies, bakers, categories), so show text and
        // photos; whatever people type stays masked.
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
        beforeErrorSampling: () => false,
      }),
    )
  } catch {
    // Blocked by an ad blocker or offline: feedback still sends, just without a replay.
  }
}

/**
 * Makes `el` open the feedback form when clicked. Returns the cleanup, or nothing when
 * monitoring is off.
 */
export function attachFeedback(el: HTMLElement): (() => void) | undefined {
  return getFeedback()?.attachTo(el)
}

/** Reports an error the UI already showed to the user (a failed save, upload, …). */
export function reportError(error: unknown, action: string) {
  captureException(error, { tags: { action } })
}

export { reactErrorHandler, wrapCreateBrowserRouter } from '@sentry/react'

/**
 * Notes that something is taking far too long (a ballot still sending, a page still
 * loading), so Sentry shows how often phones get stuck and the breadcrumbs before it.
 */
export function reportSlow(action: string) {
  captureMessage(`Still waiting: ${action}`, { level: 'warning', tags: { action } })
}
