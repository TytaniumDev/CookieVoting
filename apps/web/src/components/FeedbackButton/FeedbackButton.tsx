import { attachFeedback } from '../../lib/monitoring.ts'

export interface FeedbackButtonProps {
  /** Opens Sentry's feedback form when monitoring is on; the default does that. */
  attach?: (el: HTMLElement) => (() => void) | undefined
}

/**
 * The app bar's "Feedback" button: opens Sentry's form for reporting a problem, with a
 * screenshot on laptops and a replay of the last minute on every device. Icon only on
 * phones, where the bar needs the room for the page title.
 */
export function FeedbackButton({ attach = attachFeedback }: FeedbackButtonProps) {
  return (
    <button
      type="button"
      ref={(el) => (el ? attach(el) : undefined)}
      aria-label="Send feedback or report a problem"
      className="-my-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-control px-2 font-display font-semibold text-on-primary transition-colors hover:bg-primary-hover active:translate-y-px"
    >
      <span aria-hidden="true">💬</span>
      <span aria-hidden="true" className="max-sm:hidden">
        Feedback
      </span>
    </button>
  )
}
